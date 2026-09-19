const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const RANGE_DAYS = { week: 7, month: 30, all: null };

function rangeStart(range) {
  const days = RANGE_DAYS[range];
  if (!days) return null;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

// Points earned per user within a time range, derived from scan history
// (scans are immutable, so "points earned this week/month" can always be
// recomputed rather than tracked as a separate running counter).
function rankedUsers(range) {
  const since = rangeStart(range);
  const scans = db.get('scans').value();
  const users = db.get('users').value();

  const earnedByUser = new Map();
  for (const scan of scans) {
    if (since && new Date(scan.createdAt).getTime() < since) continue;
    const prev = earnedByUser.get(scan.userId) || 0;
    earnedByUser.set(scan.userId, prev + (scan.pointsEarned ?? scan.bottleCount * 5));
  }

  const rows = users
    .map((u) => ({
      id: u.id,
      name: u.name,
      // All-time uses the live spendable balance (matches what's shown on
      // the user's own profile/wallet); week/month use points earned
      // within that window so the board resets each period.
      points: range === 'all' ? u.points || 0 : earnedByUser.get(u.id) || 0,
    }))
    .filter((u) => u.points > 0)
    .sort((a, b) => b.points - a.points);

  return rows;
}

// GET /api/leaderboard?range=week|month|all
router.get('/', (req, res) => {
  const range = ['week', 'month', 'all'].includes(req.query.range) ? req.query.range : 'week';
  const rows = rankedUsers(range);
  const top = rows.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }));
  res.json({ range, totalUsers: rows.length, leaderboard: top });
});

// GET /api/leaderboard/me?range=... — optional auth via bearer token so it
// can be called alongside the public list without a second login prompt.
router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  let userId;
  try {
    userId = jwt.verify(token, JWT_SECRET).userId;
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const range = ['week', 'month', 'all'].includes(req.query.range) ? req.query.range : 'week';
  const rows = rankedUsers(range);
  const index = rows.findIndex((r) => r.id === userId);

  if (index === -1) {
    return res.json({ range, rank: null, points: 0, totalUsers: rows.length });
  }
  res.json({ range, rank: index + 1, points: rows[index].points, totalUsers: rows.length });
});

module.exports = router;
