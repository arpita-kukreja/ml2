const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    score: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalTimeMs: { type: Number, default: 0 },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  roomCode: { type: String, required: true },
  roomName: { type: String, required: true },
  participants: [ParticipantSchema],
  totalPomodoros: { type: Number, default: 0 },
  totalStudyMins: { type: Number, default: 0 },
  weakTopics: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', SessionSchema);
