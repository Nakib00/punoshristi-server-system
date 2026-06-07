const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Operator (web) creates a counting session: "Stop" generates a one-time QR
// that encodes a random token. The QR image itself only carries the token —
// the bottle count is looked up server-side when the token is redeemed.
router.post('/', async (req, res) => {
  const { bottleCount } = req.body || {};
  const count = Number(bottleCount);

  if (!Number.isFinite(count) || count <= 0 || !Number.isInteger(count)) {
    return res.status(400).json({ message: 'bottleCount must be a positive whole number' });
  }

  const session = {
    id: uuidv4(),
    token: uuidv4(),
    bottleCount: count,
    used: false,
    redeemedBy: null,
    redeemedAt: null,
    createdAt: new Date().toISOString(),
  };

  db.get('sessions').push(session).write();

  const qrPayload = JSON.stringify({ type: 'bottle-deposit', token: session.token });
  const qrDataUrl = await QRCode.toDataURL(qrPayload);

  res.status(201).json({
    session: {
      id: session.id,
      bottleCount: session.bottleCount,
      token: session.token,
      used: session.used,
      createdAt: session.createdAt,
    },
    qrDataUrl,
  });
});

router.get('/:id', (req, res) => {
  const session = db.get('sessions').find({ id: req.params.id }).value();
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json({ session });
});

module.exports = router;
