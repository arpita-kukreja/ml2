const express = require('express');
const { createRoom, getRoomInfo, getUserRooms } = require('../controllers/room.controller');
const { uploadMiddleware, uploadPDF, aiChat, endSession } = require('../controllers/quiz.controller');
const { optionalAuth, authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// ── Room CRUD ─────────────────────────────────────────────────────────────────
// POST /api/rooms/create
router.post('/create', optionalAuth, createRoom);

// GET /api/rooms/user — Get all rooms created by logged-in user
router.get('/user', authMiddleware, getUserRooms);


// GET /api/rooms/:roomCode — room info / pre-join validation
router.get('/:roomCode', getRoomInfo);

// ── PDF & Quiz ────────────────────────────────────────────────────────────────
// POST /api/rooms/:roomCode/upload — upload PDF, extract text, generate quiz
router.post('/:roomCode/upload', uploadMiddleware, uploadPDF);

// POST /api/rooms/:roomCode/ai-chat — AI tutor answers a student question
router.post('/:roomCode/ai-chat', aiChat);

// POST /api/rooms/:roomCode/end — finalise session, archive stats, deactivate room
router.post('/:roomCode/end', endSession);

module.exports = router;
