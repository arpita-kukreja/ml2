import { useEffect, useRef } from 'react';
import socket from '../utils/socket';
import { useRoom } from '../context/RoomContext';

export function useSocket(roomCode, username, isHost, drawCallback, onRoomStart) {
  const {
    setMembers,
    setTimerState,
    setQuizReady,
    setCurrentQuestion,
    setCurrentQuestionIdx,
    setAnswerResult,
    setLeaderboard,
    appendChat,
    setQuizStarted,
  } = useRoom();

  const intervalRef = useRef(null);

  // ── Local countdown tick ──────────────────────────────────────────────────
  const startLocalCountdown = (remainingSeconds) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimerState((prev) => {
        if (!prev.isRunning) { clearInterval(intervalRef.current); return prev; }
        const next = Math.max(0, prev.remainingSeconds - 1);
        if (next === 0) clearInterval(intervalRef.current);
        return { ...prev, remainingSeconds: next };
      });
    }, 1000);
  };

  useEffect(() => {
    if (!roomCode || !username) return;

    socket.connect();

    socket.on('connect', () => {
      socket.emit('join-room', { roomCode, username });
    });

    socket.on('room:users-updated', ({ members }) => setMembers(members));
    
    socket.on('room:start', () => {
      if (onRoomStart) onRoomStart();
    });

    socket.on('timer:sync', (data) => {
      setTimerState((prev) => ({ ...prev, ...data }));
      if (data.isRunning) startLocalCountdown(data.remainingSeconds);
      else if (intervalRef.current) clearInterval(intervalRef.current);
    });

    socket.on('timer:session-complete', ({ sessionCount, nextType }) => {
      setTimerState((prev) => ({ ...prev, sessionCount, type: nextType, isRunning: false, remainingSeconds: 0 }));
      if (intervalRef.current) clearInterval(intervalRef.current);
    });

    socket.on('quiz:ready', ({ questionCount }) => {
      setQuizReady(true);
    });

    socket.on('quiz:question', (data) => {
      setCurrentQuestion(data);
      setCurrentQuestionIdx(data.questionIndex);
      setQuizStarted(true);
      setAnswerResult(null);
    });

    socket.on('quiz:answer-result', (result) => {
      setAnswerResult(result);
    });

    socket.on('leaderboard:update', ({ members }) => setLeaderboard(members));

    socket.on('whiteboard:draw', (data) => {
      if (drawCallback) drawCallback(data);
    });

    socket.on('whiteboard:init', ({ strokes }) => {
      if (drawCallback) strokes.forEach((s) => drawCallback(s));
    });

    socket.on('chat:message', (msg) => appendChat(msg));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      socket.off('connect');
      socket.off('room:start');
      socket.off('room:users-updated');
      socket.off('timer:sync');
      socket.off('timer:session-complete');
      socket.off('quiz:ready');
      socket.off('quiz:question');
      socket.off('quiz:answer-result');
      socket.off('leaderboard:update');
      socket.off('whiteboard:draw');
      socket.off('whiteboard:init');
      socket.off('chat:message');
      socket.disconnect();
    };
  }, [roomCode, username]);

  // ── Emit helpers ──────────────────────────────────────────────────────────
  const startTimer = (duration, type) => socket.emit('timer:start', { duration, type });
  const pauseTimer = () => socket.emit('timer:pause');
  const resumeTimer = () => socket.emit('timer:resume');
  const completeTimer = () => socket.emit('timer:complete');
  const submitAnswer = (questionIndex, answerIndex, timeTaken) =>
    socket.emit('quiz:answer', { questionIndex, answerIndex, timeTaken });
  const sendDraw = (payload) => socket.emit('whiteboard:draw', payload);
  const sendChatMessage = (content) => socket.emit('chat:message', { content });
  const startQuiz = () => socket.emit('quiz:start');
  const nextQuestion = (nextIndex) => socket.emit('quiz:next', { nextIndex });
  const startSession = () => socket.emit('room:start');

  return { startSession, startTimer, pauseTimer, resumeTimer, completeTimer, submitAnswer, sendDraw, sendChatMessage, startQuiz, nextQuestion };
}
