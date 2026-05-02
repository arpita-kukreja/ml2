const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Room = require('../models/Room.model');
const Session = require('../models/Session.model');
const { extractText } = require('../services/pdf.service');
const { generateQuiz, answerQuestion } = require('../services/gemini.service');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadMiddleware = upload.single('pdf');

// ── Controllers ───────────────────────────────────────────────────────────────

const uploadPDF = async (req, res) => {
  try {
    const roomCode = req.params.roomCode;

    console.log('[uploadPDF] Request received:', { roomCode, hasFile: !!req.file });

    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }
    if (!roomCode) {
      return res.status(400).json({ message: 'roomCode is required.' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      // Clean up uploaded file if room not found
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(404).json({ message: 'Room not found.' });
    }

    console.log('[uploadPDF] Extracting text from:', req.file.path);
    const pdfText = await extractText(req.file.path);
    
    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(422).json({ message: 'Could not extract text from the PDF. Is it a scanned image?' });
    }

    console.log('[uploadPDF] Text extracted, length:', pdfText.length);
    room.pdfText = pdfText;

    console.log('[uploadPDF] Generating quiz...');
    const quiz = await generateQuiz(pdfText);
    console.log('[uploadPDF] Quiz generated, questions:', quiz.length);

    room.quiz = quiz;
    await room.save();

    const { io } = require('../socket');
    io.to(roomCode.toUpperCase()).emit('quiz:ready', { questionCount: quiz.length });

    return res.status(200).json({ success: true, questionCount: quiz.length });
  } catch (err) {
    console.error('[uploadPDF] Error:', err);
    // Clean up file on error
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    return res.status(500).json({ message: 'PDF processing failed.', error: err.message });
  }
};

const aiChat = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'question is required.' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    if (!room.pdfText || room.pdfText.trim().length === 0) {
      return res.status(200).json({
        answer: 'No notes have been uploaded yet. Please ask the host to upload PDF notes first.',
      });
    }

    const answer = await answerQuestion(question.trim(), room.pdfText);

    const timestamp = new Date();
    room.chatHistory.push({ sender: 'AI Tutor', content: answer, isAI: true, timestamp });
    await room.save();

    const { io } = require('../socket');
    io.to(roomCode.toUpperCase()).emit('chat:message', {
      sender: 'AI Tutor',
      content: answer,
      isAI: true,
      timestamp,
    });

    return res.status(200).json({ answer });
  } catch (err) {
    console.error('[aiChat]', err);
    return res.status(500).json({ message: 'AI chat failed.', error: err.message });
  }
};

const endSession = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const totalPomodoros = room.timerState?.sessionCount ?? 0;
    const totalStudyMins = totalPomodoros * 25;

    const quizTopics = [...new Set((room.quiz || []).map((q) => q.topic).filter(Boolean))];

    const humanMessages = (room.chatHistory || [])
      .filter((m) => !m.isAI)
      .map((m) => m.content.toLowerCase());

    const topicMentionCounts = quizTopics.map((topic) => ({
      topic,
      count: humanMessages.filter((msg) => msg.includes(topic.toLowerCase())).length,
    }));

    const weakTopics = topicMentionCounts
      .filter(({ count }) => count > 0)
      .map(({ topic }) => topic);

    const participants = (room.members || []).map((m) => ({
      username: m.username,
      score: m.score ?? 0,
      correctAnswers: 0,
      totalTimeMs: totalStudyMins * 60 * 1000,
    }));

    const session = await Session.create({
      roomId: room._id,
      roomCode: room.roomCode,
      roomName: room.roomName,
      participants,
      totalPomodoros,
      totalStudyMins,
      weakTopics,
    });

    room.isActive = false;
    await room.save();

    return res.status(200).json({ session });
  } catch (err) {
    console.error('[endSession]', err);
    return res.status(500).json({ message: 'Failed to end session.', error: err.message });
  }
};

module.exports = { uploadMiddleware, uploadPDF, aiChat, endSession };
