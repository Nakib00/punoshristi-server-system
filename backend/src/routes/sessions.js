const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Operator creates a counting session linked to a machine.
// POST /api/sessions  { bottleCount, machineId }
router.post('/', async (req, res) => {
  const { bottleCount, machineId } = req.body || {};
  const count = Number(bottleCount);

  if (!Number.isFinite(count) || count <= 0 || !Number.isInteger(count)) {
    return res.status(400).json({ message: 'bottleCount must be a positive whole number' });
  }

  let machineName = null;
  let machineLocation = null;
  if (machineId) {
    const machine = db.get('machines').find({ id: machineId }).value();
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    machineName = machine.name;
    machineLocation = machine.location;
  }

  const session = {
    id: uuidv4(),
    token: uuidv4(),
    bottleCount: count,
    machineId: machineId || null,
    machineName,
    machineLocation,
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
      machineId: session.machineId,
      machineName: session.machineName,
      machineLocation: session.machineLocation,
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
