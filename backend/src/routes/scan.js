const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const CAPACITY_ALERT_THRESHOLD = 0.8; // 80%

function createCapacityNotification(machine, percentage) {
  // Only create if there isn't already an unacknowledged one for this machine
  const existing = db
    .get('notifications')
    .find({ machineId: machine.id, acknowledged: false })
    .value();
  if (existing) return;

  const notification = {
    id: uuidv4(),
    type: 'capacity_warning',
    machineId: machine.id,
    machineName: machine.name,
    machineLocation: machine.location,
    percentage,
    message: `${machine.name} (${machine.location}) মেশিনটি ${percentage}% পূর্ণ হয়ে গেছে। ভাঙ্গারিয়া পার্টনারকে বোতল সংগ্রহের জন্য পাঠান।`,
    acknowledged: false,
    createdAt: new Date().toISOString(),
  };
  db.get('notifications').push(notification).write();
}

module.exports = function createScanRouter(io) {
  const router = express.Router();

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

    // Mark session as used
    sessions.find({ token }).assign({ used: true, redeemedBy: user.id, redeemedAt }).write();

    // Update user bottle count
    const newCount = (user.bottleCount || 0) + session.bottleCount;
    usersCollection.find({ id: user.id }).assign({ bottleCount: newCount }).write();

    // Record scan history
    const scan = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      machineId: session.machineId || null,
      machineName: session.machineName || null,
      machineLocation: session.machineLocation || null,
      sessionId: session.id,
      bottleCount: session.bottleCount,
      createdAt: redeemedAt,
    };
    db.get('scans').push(scan).write();

    // Update machine bottle count + check capacity threshold
    if (session.machineId) {
      const machine = db.get('machines').find({ id: session.machineId }).value();
      if (machine) {
        const newMachineBottles = (machine.currentBottles || 0) + session.bottleCount;
        db.get('machines')
          .find({ id: session.machineId })
          .assign({ currentBottles: newMachineBottles })
          .write();

        if (machine.capacity > 0) {
          const fillPercent = Math.round((newMachineBottles / machine.capacity) * 100);
          if (newMachineBottles / machine.capacity >= CAPACITY_ALERT_THRESHOLD) {
            createCapacityNotification(
              { ...machine, name: machine.name, location: machine.location },
              fillPercent
            );
            // Emit real-time alert to admin room
            io.to('admin').emit('machine-capacity-alert', {
              machineId: machine.id,
              machineName: machine.name,
              machineLocation: machine.location,
              fillPercent,
            });
          }
        }
      }
    }

    const payload = {
      addedBottles: session.bottleCount,
      bottleCount: newCount,
      redeemedAt,
      machineName: session.machineName || null,
      machineLocation: session.machineLocation || null,
    };

    io.to(`user:${user.id}`).emit('bottle-count-updated', payload);

    res.json({
      message: `Added ${session.bottleCount} bottle(s) to your account`,
      ...payload,
    });
  });

  return router;
};
