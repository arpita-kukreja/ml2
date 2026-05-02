const Room = require('../models/Room.model');

/**
 * Generates a random 6-character uppercase alphabetic room code.
 * Uses only uppercase letters (A-Z) to avoid digit confusion.
 */
const generateRoomCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
};

/**
 * POST /api/rooms/create
 * Body: { roomName }
 * Creates a new study room and returns its code, id, and name.
 */
const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName || !roomName.trim()) {
      return res.status(400).json({ message: 'roomName is required.' });
    }

    // Ensure the generated code is unique (retry on collision)
    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = generateRoomCode();
      exists = await Room.exists({ roomCode });
    }

    const room = await Room.create({
      roomCode,
      roomName: roomName.trim(),
      ownerId: req.user?.id || null,
    });

    return res.status(201).json({
      roomCode: room.roomCode,
      roomId: room._id,
      roomName: room.roomName,
    });
  } catch (error) {
    console.error('[createRoom]', error);
    return res.status(500).json({ message: 'Failed to create room.', error: error.message });
  }
};

/**
 * GET /api/rooms/:roomCode
 * Returns basic room info for pre-join checks.
 */
const getRoomInfo = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() }).lean();

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    return res.status(200).json({
      roomCode: room.roomCode,
      roomName: room.roomName,
      memberCount: room.members ? room.members.length : 0,
      isActive: room.isActive,
      quizReady: Array.isArray(room.quiz) && room.quiz.length > 0,
      timerState: room.timerState,
      isStarted: room.quizStarted,
    });
  } catch (error) {
    console.error('[getRoomInfo]', error);
    return res.status(500).json({ message: 'Failed to fetch room info.', error: error.message });
  }
};

// Get user's hosted rooms
const getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    // We can also fetch Sessions that belong to this user if we want full history
    const rooms = await Room.find({ ownerId: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ rooms });
  } catch (error) {
    console.error('[getUserRooms]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createRoom, getRoomInfo, getUserRooms };
