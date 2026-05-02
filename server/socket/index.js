const { Server } = require('socket.io');
const { server } = require('../app');
const Room = require('../models/Room.model');

// ── In-memory whiteboard stroke store (roomCode → stroke[]) ──────────────────
// Keeps draw events out of MongoDB on every stroke; hydrates DB on join only.
const whiteboardStrokes = new Map();
const MAX_STROKES = 500;

// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the live remainingSeconds for a running timer.
 */
const calcRemaining = (timerState) => {
  if (!timerState.isRunning || !timerState.startedAt) {
    return timerState.remainingSeconds ?? 0;
  }
  const elapsed = (Date.now() - new Date(timerState.startedAt).getTime()) / 1000;
  return Math.max(0, Math.round((timerState.remainingSeconds ?? 0) - elapsed));
};

/**
 * Returns the room document or emits an error and returns null.
 */
const getRoom = async (socket, roomCode) => {
  const room = await Room.findOne({ roomCode });
  if (!room) {
    socket.emit('error', { message: 'Room not found.' });
    return null;
  }
  return room;
};

/**
 * Returns true if the calling socket is the room host.
 */
const isHost = (room, socketId) => room.hostSocketId === socketId;

// ─────────────────────────────────────────────────────────────────────────────
// Connection handler
// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── 1. join-room ────────────────────────────────────────────────────────────
  socket.on('join-room', async ({ roomCode, username }) => {
    try {
      const room = await getRoom(socket, roomCode);
      if (!room) return;

      // Add socket to Socket.io channel
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.username = username;

      // Add / update member record
      const existingIdx = room.members.findIndex((m) => m.username === username);
      if (existingIdx !== -1) {
        room.members[existingIdx].socketId = socket.id;
        room.members[existingIdx].isConnected = true;
      } else {
        room.members.push({ username, socketId: socket.id, score: 0, isConnected: true });
      }

      // Assign host if none set yet
      if (!room.hostSocketId) {
        room.hostSocketId = socket.id;
      }

      await room.save();

      // Sync timer if already running
      if (room.timerState && room.timerState.isRunning) {
        socket.emit('timer:sync', {
          remainingSeconds: calcRemaining(room.timerState),
          isRunning: true,
          type: room.timerState.type,
          sessionCount: room.timerState.sessionCount,
          duration: room.timerState.duration,
        });
      }

      // Notify late joiner if quiz is ready
      if (room.quiz && room.quiz.length > 0) {
        socket.emit('quiz:ready', { questionCount: room.quiz.length });
      }

      // Send existing whiteboard strokes to late joiner
      const strokes = whiteboardStrokes.get(roomCode) || [];
      socket.emit('whiteboard:init', { strokes });

      // Tell late joiner if session actively started
      if (room.isStarted || (room.timerState && room.timerState.isRunning)) {
        socket.emit('room:start');
      }

      // Tell everyone in the room about the updated member list
      io.to(roomCode).emit('room:users-updated', { members: room.members });
    } catch (err) {
      console.error('[join-room]', err);
      socket.emit('error', { message: 'Failed to join room.' });
    }
  });

  // ── 1.5 room:start ──────────────────────────────────────────────────────────
  socket.on('room:start', async () => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room || !isHost(room, socket.id)) return;
      
      room.isStarted = true;
      await room.save();
      
      io.to(roomCode).emit('room:start');
    } catch (err) {
      console.error('[room:start]', err);
    }
  });

  // ── 2. timer:start ──────────────────────────────────────────────────────────
  socket.on('timer:start', async ({ duration, type }) => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room || !isHost(room, socket.id)) return;

      const now = new Date();
      room.timerState = {
        ...room.timerState,
        isRunning: true,
        startedAt: now,
        remainingSeconds: duration * 60,
        duration,
        type: type || 'focus',
      };
      await room.save();

      io.to(roomCode).emit('timer:sync', {
        isRunning: true,
        remainingSeconds: duration * 60,
        type: room.timerState.type,
        startedAt: now,
        sessionCount: room.timerState.sessionCount,
      });
    } catch (err) {
      console.error('[timer:start]', err);
    }
  });

  // ── 3. timer:pause ──────────────────────────────────────────────────────────
  socket.on('timer:pause', async () => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room || !isHost(room, socket.id)) return;

      const elapsed =
        (Date.now() - new Date(room.timerState.startedAt).getTime()) / 1000;
      const newRemaining = Math.round(
        Math.max(0, (room.timerState.remainingSeconds ?? 0) - elapsed)
      );

      room.timerState.isRunning = false;
      room.timerState.pausedAt = new Date();
      room.timerState.remainingSeconds = newRemaining;
      await room.save();

      io.to(roomCode).emit('timer:sync', {
        isRunning: false,
        remainingSeconds: newRemaining,
        type: room.timerState.type,
        sessionCount: room.timerState.sessionCount,
        duration: room.timerState.duration,
      });
    } catch (err) {
      console.error('[timer:pause]', err);
    }
  });

  // ── 4. timer:resume ─────────────────────────────────────────────────────────
  socket.on('timer:resume', async () => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room || !isHost(room, socket.id)) return;

      const now = new Date();
      room.timerState.isRunning = true;
      room.timerState.startedAt = now;
      // remainingSeconds stays as-is (the paused snapshot)
      await room.save();

      io.to(roomCode).emit('timer:sync', {
        isRunning: true,
        remainingSeconds: room.timerState.remainingSeconds,
        type: room.timerState.type,
        type: room.timerState.type,
        startedAt: now,
        sessionCount: room.timerState.sessionCount,
        duration: room.timerState.duration,
      });
    } catch (err) {
      console.error('[timer:resume]', err);
    }
  });

  // ── 5. timer:complete ───────────────────────────────────────────────────────
  socket.on('timer:complete', async () => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room) return;

      const wasFocus = room.timerState.type === 'focus';
      const nextType = wasFocus ? 'break' : 'focus';

      if (wasFocus) {
        room.timerState.sessionCount = (room.timerState.sessionCount || 0) + 1;
      }

      room.timerState.type = nextType;
      room.timerState.isRunning = false;
      room.timerState.remainingSeconds = 0;
      await room.save();

      io.to(roomCode).emit('timer:session-complete', {
        sessionCount: room.timerState.sessionCount,
        nextType,
      });
    } catch (err) {
      console.error('[timer:complete]', err);
    }
  });

  // ── 6. quiz:start ───────────────────────────────────────────────────────────
  socket.on('quiz:start', async () => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room || !isHost(room, socket.id)) return;
      if (!room.quiz || room.quiz.length === 0) return;

      room.quizStarted = true;
      await room.save();

      io.to(roomCode).emit('quiz:question', {
        questionIndex: 0,
        question: room.quiz[0].question,
        options: room.quiz[0].options,
        totalQuestions: room.quiz.length,
      });
    } catch (err) {
      console.error('[quiz:start]', err);
    }
  });

  // ── 7. quiz:next ────────────────────────────────────────────────────────────
  socket.on('quiz:next', async ({ nextIndex }) => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room || !isHost(room, socket.id)) return;

      const q = room.quiz[nextIndex];
      if (!q) return;

      io.to(roomCode).emit('quiz:question', {
        questionIndex: nextIndex,
        question: q.question,
        options: q.options,
        totalQuestions: room.quiz.length,
      });
    } catch (err) {
      console.error('[quiz:next]', err);
    }
  });

  // ── 8. quiz:answer ──────────────────────────────────────────────────────────
  socket.on('quiz:answer', async ({ questionIndex, answerIndex, timeTaken }) => {
    try {
      const { roomCode } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room) return;

      const question = room.quiz[questionIndex];
      if (!question) return;

      const isCorrect = answerIndex === question.correctIndex;
      let points = 0;
      if (isCorrect) {
        points = 10;
        if (timeTaken < 10) points += 3; // speed bonus
      }

      // Update member score
      const memberIdx = room.members.findIndex((m) => m.socketId === socket.id);
      if (memberIdx !== -1) {
        room.members[memberIdx].score = (room.members[memberIdx].score || 0) + points;
        room.markModified('members');
      }
      await room.save();

      // Answer feedback to this socket only
      socket.emit('quiz:answer-result', {
        isCorrect,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        pointsEarned: points,
      });

      // Leaderboard broadcast (sorted descending by score)
      const sorted = [...room.members].sort((a, b) => b.score - a.score);
      io.to(roomCode).emit('leaderboard:update', { members: sorted });
    } catch (err) {
      console.error('[quiz:answer]', err);
    }
  });

  // ── 9. whiteboard:draw ──────────────────────────────────────────────────────
  socket.on('whiteboard:draw', (payload) => {
    const { roomCode, username } = socket.data;
    if (!roomCode) return;

    // Store in memory (capped at MAX_STROKES)
    if (!whiteboardStrokes.has(roomCode)) {
      whiteboardStrokes.set(roomCode, []);
    }
    const strokes = whiteboardStrokes.get(roomCode);
    strokes.push({ ...payload, username });
    if (strokes.length > MAX_STROKES) strokes.splice(0, strokes.length - MAX_STROKES);

    // Broadcast to everyone EXCEPT the sender
    socket.to(roomCode).emit('whiteboard:draw', { ...payload, username });
  });

  // ── 10. chat:message ────────────────────────────────────────────────────────
  socket.on('chat:message', async ({ content }) => {
    try {
      const { roomCode, username } = socket.data;
      const room = await getRoom(socket, roomCode);
      if (!room) return;

      const timestamp = new Date();
      room.chatHistory.push({ sender: username, content, isAI: false, timestamp });
      await room.save();

      io.to(roomCode).emit('chat:message', {
        sender: username,
        content,
        isAI: false,
        timestamp,
      });
    } catch (err) {
      console.error('[chat:message]', err);
    }
  });

  // ── 11. disconnect ──────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    try {
      const { roomCode } = socket.data;
      if (!roomCode) return;

      const room = await Room.findOne({ roomCode });
      if (!room) return;

      // Mark member as disconnected
      const memberIdx = room.members.findIndex((m) => m.socketId === socket.id);
      if (memberIdx !== -1) {
        room.members[memberIdx].isConnected = false;
      }

      // Re-assign host if the host left
      if (room.hostSocketId === socket.id) {
        const nextHost = room.members.find(
          (m) => m.isConnected && m.socketId !== socket.id
        );
        room.hostSocketId = nextHost ? nextHost.socketId : null;
      }

      await room.save();

      io.to(roomCode).emit('room:users-updated', { members: room.members });
      console.log(`[socket] disconnected: ${socket.id} (${socket.data.username ?? 'unknown'})`);
    } catch (err) {
      console.error('[disconnect]', err);
    }
  });
});

module.exports = { io };
