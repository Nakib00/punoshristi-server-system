const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

module.exports = function createScanRouter(io) {
  const router = express.Router();

  // Mobile app calls this after scanning a QR code. The token is single-use:
  // once redeemed it is permanently marked `used` and cannot be redeemed again.
  router.post('/', requireAuth, (req, res) => {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ message: 'token is required' });
    }

    const sessions = db.get('sessions');
    const session = sessions.find({ token }).value();

    if (!session) {
      return res.status(404).json({ message: 'QR code not recognized' });
    }
    if (session.used) {
      return res.status(409).json({ message: 'This QR code has already been used' });
    }

    const usersCollection = db.get('users');
    const user = usersCollection.find({ id: req.userId }).value();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const redeemedAt = new Date().toISOString();
    sessions
      .find({ token })
      .assign({ used: true, redeemedBy: user.id, redeemedAt })
      .write();

    const newCount = (user.bottleCount || 0) + session.bottleCount;
    usersCollection.find({ id: user.id }).assign({ bottleCount: newCount }).write();

    const payload = {
      addedBottles: session.bottleCount,
      bottleCount: newCount,
      redeemedAt,
    };

    io.to(`user:${user.id}`).emit('bottle-count-updated', payload);

    res.json({
      message: `Added ${session.bottleCount} bottle(s) to your account`,
      ...payload,
    });
  });

  return router;
};
