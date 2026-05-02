const express = require('express');
const Session = require('../models/Session.model');

const router = express.Router();

// GET /api/sessions/:roomCode — retrieve the archived session for a given room
router.get('/:roomCode', async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    return res.status(200).json({ session });
  } catch (err) {
    console.error('[getSession]', err);
    return res.status(500).json({ message: 'Failed to fetch session.', error: err.message });
  }
});

module.exports = router;
