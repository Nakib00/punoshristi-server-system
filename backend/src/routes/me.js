const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { pointsForBottles, co2SavedKg, levelInfo } = require('../lib/points');

const router = express.Router();

function rankOf(userId) {
  const users = db.get('users').value().slice().sort((a, b) => (b.points || 0) - (a.points || 0));
  const index = users.findIndex((u) => u.id === userId);
  return { rank: index === -1 ? null : index + 1, totalUsers: users.length };
}

// GET /api/my/scans — legacy path kept for backward compatibility with the
// operator/user apps that already call it.
router.get('/scans', requireAuth, (req, res) => {
  const scans = db.get('scans').filter({ userId: req.userId }).value().slice().reverse();
  res.json({ scans });
});

// GET /api/my/stats — everything the dashboard/profile cards need in one call.
router.get('/stats', requireAuth, (req, res) => {
  const user = db.get('users').find({ id: req.userId }).value();
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { rank, totalUsers } = rankOf(user.id);
  const level = levelInfo(pointsForBottles(user.bottleCount || 0));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const bottlesThisMonth = db
    .get('scans')
    .filter((s) => s.userId === user.id && new Date(s.createdAt) >= startOfMonth)
    .value()
    .reduce((sum, s) => sum + (s.bottleCount || 0), 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const bottlesToday = db
    .get('scans')
    .filter((s) => s.userId === user.id && new Date(s.createdAt) >= startOfToday)
    .value()
    .reduce((sum, s) => sum + (s.bottleCount || 0), 0);

  res.json({
    points: user.points || 0,
    bottleCount: user.bottleCount || 0,
    bottlesToday,
    rank,
    totalUsers,
    level,
    co2SavedKgThisMonth: co2SavedKg(bottlesThisMonth),
  });
});

// GET /api/my/activity — recycle-ins (+points) and reward redemptions
// (-points), newest first, merged into one feed for the dashboard/history.
router.get('/activity', requireAuth, (req, res) => {
  const limit = Number(req.query.limit) || 20;

  const scanEntries = db
    .get('scans')
    .filter({ userId: req.userId })
    .value()
    .map((s) => ({
      id: s.id,
      type: 'recycle',
      title: `${s.bottleCount} bottle${s.bottleCount === 1 ? '' : 's'} recycled${s.machineName ? ` at ${s.machineName}` : ''}`,
      pointsDelta: s.pointsEarned ?? s.bottleCount * 5,
      createdAt: s.createdAt,
    }));

  const redemptionEntries = db
    .get('redemptions')
    .filter({ userId: req.userId })
    .value()
    .map((r) => ({
      id: r.id,
      type: 'redemption',
      title: `Redeemed: ${r.offerTitle} at ${r.partnerName}`,
      pointsDelta: -r.pointsCost,
      createdAt: r.createdAt,
    }));

  const activity = [...scanEntries, ...redemptionEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  res.json({ activity });
});

// POST /api/my/favorites/:machineId — toggle a machine as favorited.
router.post('/favorites/:machineId', requireAuth, (req, res) => {
  const user = db.get('users').find({ id: req.userId }).value();
  if (!user) return res.status(404).json({ message: 'User not found' });

  const favorites = user.favorites || [];
  const isFavorited = favorites.includes(req.params.machineId);
  const next = isFavorited ? favorites.filter((id) => id !== req.params.machineId) : [...favorites, req.params.machineId];

  db.get('users').find({ id: user.id }).assign({ favorites: next }).write();
  res.json({ favorites: next, favorited: !isFavorited });
});

module.exports = router;
