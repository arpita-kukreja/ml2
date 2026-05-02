require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');

const roomRoutes = require('./routes/room.routes');
const sessionRoutes = require('./routes/session.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sessions', sessionRoutes);

// Health-check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── HTTP Server (exported so Socket.io can attach) ────────────────────────────
const server = http.createServer(app);

// ── MongoDB Connection ─────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  MongoDB connected');
  } catch (err) {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀  Server running on port ${PORT}`);
});

module.exports = { app, server };

// ── Socket.io (imported AFTER exports so the circular require resolves correctly)
// socket/index.js does require('../app') — Node returns the already-populated
// exports object above, which already contains { app, server }.
require('./socket');
