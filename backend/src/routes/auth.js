const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    bottleCount: user.bottleCount,
    createdAt: user.createdAt,
  };
}

function validatePhone(phone) {
  return /^\d{11}$/.test(String(phone || '').trim());
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  // Phone is optional but must be 11 digits if provided
  const normalizedPhone = phone ? String(phone).trim() : null;
  if (normalizedPhone && !validatePhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 11 digits' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const emailExists = db.get('users').find({ email: normalizedEmail }).value();
  if (emailExists) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  if (normalizedPhone) {
    const phoneExists = db.get('users').find({ phone: normalizedPhone }).value();
    if (phoneExists) {
      return res.status(409).json({ message: 'An account with this phone number already exists' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name: String(name).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash,
    bottleCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.get('users').push(user).write();

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /auth/login  — accepts { emailOrPhone, password } or legacy { email, password }
router.post('/login', async (req, res) => {
  const { emailOrPhone, email, password } = req.body || {};
  const rawIdentifier = String(emailOrPhone || email || '').trim();

  if (!rawIdentifier || !password) {
    return res.status(400).json({ message: 'Email/phone and password are required' });
  }

  // Try email match first (lowercase)
  let user = db.get('users').find({ email: rawIdentifier.toLowerCase() }).value();

  // Then try phone match (exact 11-digit string)
  if (!user && /^\d{10,11}$/.test(rawIdentifier)) {
    user = db.get('users').find({ phone: rawIdentifier }).value();
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: publicUser(user) });
});

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.get('users').find({ id: req.userId }).value();
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
