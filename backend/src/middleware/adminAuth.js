const jwt = require('jsonwebtoken');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'punoshristi-admin-secret-2024';

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('Not admin');
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
}

module.exports = { requireAdmin, ADMIN_JWT_SECRET };
