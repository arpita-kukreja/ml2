const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    socketId: { type: String, required: true },
    score: { type: Number, default: 0 },
    isConnected: { type: Boolean, default: true },
  },
  { _id: false }
);

const TimerStateSchema = new mongoose.Schema(
  {
    duration: { type: Number, default: 25 },
    remainingSeconds: { type: Number },
    startedAt: { type: Date },
    pausedAt: { type: Date },
    isRunning: { type: Boolean, default: false },
    type: { type: String, default: 'focus' },
    sessionCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuizItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, required: true },
    explanation: { type: String },
    topic: { type: String },
  },
  { _id: false }
);

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    content: { type: String, required: true },
    isAI: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  roomName: { type: String, required: true },
  hostSocketId: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [MemberSchema],
  isStarted: { type: Boolean, default: false },
  timerState: { type: TimerStateSchema, default: () => ({}) },
  pdfText: { type: String },
  quiz: [QuizItemSchema],
  quizStarted: { type: Boolean, default: false },
  chatHistory: [ChatMessageSchema],
  isActive: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL: auto-delete after 24 hours
  },
});

module.exports = mongoose.model('Room', RoomSchema);
