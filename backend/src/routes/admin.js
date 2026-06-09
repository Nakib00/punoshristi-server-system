const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAdmin, ADMIN_JWT_SECRET } = require('../middleware/adminAuth');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@punoshristi.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@1234';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  if (
    email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = jwt.sign({ role: 'admin', email: ADMIN_EMAIL }, ADMIN_JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({ token, admin: { email: ADMIN_EMAIL } });
});

// GET /api/admin/stats — overview numbers
router.get('/stats', requireAdmin, (req, res) => {
  const users = db.get('users').value();
  const machines = db.get('machines').value();
  const scans = db.get('scans').value();
  const notifications = db.get('notifications').filter({ acknowledged: false }).value();

  const totalBottles = scans.reduce((sum, s) => sum + (s.bottleCount || 0), 0);

  res.json({
    totalUsers: users.length,
    totalMachines: machines.length,
    activeMachines: machines.filter((m) => m.active).length,
    totalScans: scans.length,
    totalBottlesDeposited: totalBottles,
    pendingAlerts: notifications.length,
  });
});

// GET /api/admin/users
router.get('/users', requireAdmin, (req, res) => {
  const users = db.get('users').value();
  const scans = db.get('scans').value();

  const result = users.map((u) => {
    const userScans = scans.filter((s) => s.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      bottleCount: u.bottleCount,
      totalScans: userScans.length,
      createdAt: u.createdAt,
    };
  });

  res.json({ users: result });
});

// GET /api/admin/scans — full scan history, optionally filtered
router.get('/scans', requireAdmin, (req, res) => {
  let scans = db.get('scans').value().slice().reverse(); // newest first
  const { userId, machineId, limit } = req.query;

  if (userId) scans = scans.filter((s) => s.userId === userId);
  if (machineId) scans = scans.filter((s) => s.machineId === machineId);
  if (limit) scans = scans.slice(0, Number(limit));

  res.json({ scans });
});

// GET /api/admin/machines — machines with current stats
router.get('/machines', requireAdmin, (req, res) => {
  const machines = db.get('machines').value();
  const scans = db.get('scans').value();

  const result = machines.map((m) => {
    const machineScans = scans.filter((s) => s.machineId === m.id);
    const fillPercent =
      m.capacity > 0 ? Math.round((m.currentBottles / m.capacity) * 100) : 0;
    return {
      ...m,
      totalScans: machineScans.length,
      fillPercent,
      status:
        fillPercent >= 80
          ? 'critical'
          : fillPercent >= 60
          ? 'warning'
          : 'ok',
    };
  });

  res.json({ machines: result });
});

// POST /api/admin/machines/:id/empty — empty (reset) a machine
router.post('/machines/:id/empty', requireAdmin, (req, res) => {
  const machine = db.get('machines').find({ id: req.params.id }).value();
  if (!machine) return res.status(404).json({ message: 'Machine not found' });

  db.get('machines').find({ id: req.params.id }).assign({ currentBottles: 0 }).write();

  // Acknowledge all notifications for this machine
  db.get('notifications')
    .filter({ machineId: req.params.id })
    .each((n) => {
      db.get('notifications').find({ id: n.id }).assign({ acknowledged: true }).write();
    })
    .value();

  res.json({ message: 'Machine emptied and alerts cleared' });
});

// GET /api/admin/notifications
router.get('/notifications', requireAdmin, (req, res) => {
  const notifications = db
    .get('notifications')
    .filter({ acknowledged: false })
    .value()
    .slice()
    .reverse();
  res.json({ notifications });
});

// POST /api/admin/notifications/:id/acknowledge
router.post('/notifications/:id/acknowledge', requireAdmin, (req, res) => {
  const n = db.get('notifications').find({ id: req.params.id }).value();
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  db.get('notifications').find({ id: req.params.id }).assign({ acknowledged: true }).write();
  res.json({ message: 'Acknowledged' });
});

// POST /api/admin/notifications/:id/notify-partner — mark that the recycling
// partner (ভাঙ্গারিয়া) has been messaged about this machine being full.
// (Just records the action for now — no SMS/email integration yet.)
router.post('/notifications/:id/notify-partner', requireAdmin, (req, res) => {
  const n = db.get('notifications').find({ id: req.params.id }).value();
  if (!n) return res.status(404).json({ message: 'Notification not found' });

  console.log(
    `[partner-notify] ${n.machineName} (${n.machineLocation}) — ${n.percentage}% পূর্ণ। পার্টনারকে জানানো হয়েছে।`
  );

  db.get('notifications')
    .find({ id: req.params.id })
    .assign({ partnerNotified: true, partnerNotifiedAt: new Date().toISOString() })
    .write();

  const updated = db.get('notifications').find({ id: req.params.id }).value();
  res.json({ message: 'Partner notified', notification: updated });
});

module.exports = router;
