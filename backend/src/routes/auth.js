const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { pointsForBottles, levelInfo } = require('../lib/points');

const router = express.Router();

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;

function publicUser(user) {
  const { level } = levelInfo(pointsForBottles(user.bottleCount || 0));
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    bottleCount: user.bottleCount || 0,
    points: user.points || 0,
    level,
    phoneVerified: Boolean(user.phoneVerified),
    favorites: user.favorites || [],
    createdAt: user.createdAt,
  };
}

function validatePhone(phone) {
  return /^\d{11}$/.test(String(phone || '').trim());
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body || {};

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, phone and password are required' });
  }

  const normalizedPhone = String(phone).trim();
  if (!validatePhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 11 digits' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const emailExists = db.get('users').find({ email: normalizedEmail }).value();
  if (emailExists) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const phoneExists = db.get('users').find({ phone: normalizedPhone }).value();
  if (phoneExists) {
    return res.status(409).json({ message: 'An account with this phone number already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name: String(name).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash,
    bottleCount: 0,
    points: 0,
    phoneVerified: false,
    favorites: [],
    otp: null,
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

// POST /auth/otp/send — (re)issues a phone verification code for the
// logged-in (but not-yet-verified) account.
//
// This system has no SMS gateway wired up (it's a local-network deployment,
// same as the rest of the auth stack — see README "Security notes"), so the
// code is logged server-side the same way machine-capacity partner alerts
// already are. Outside production it's also echoed in the response so the
// app is testable end-to-end without a real SMS provider; wire a real
// gateway (Twilio, a local BD SMS API, etc.) here before shipping this
// publicly and drop the `devCode` field.
router.post('/otp/send', requireAuth, (req, res) => {
  const user = db.get('users').find({ id: req.userId }).value();
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.phoneVerified) return res.json({ message: 'Phone already verified' });

  if (user.otp && Date.now() - new Date(user.otp.sentAt).getTime() < OTP_RESEND_COOLDOWN_MS) {
    const waitMs = OTP_RESEND_COOLDOWN_MS - (Date.now() - new Date(user.otp.sentAt).getTime());
    return res.status(429).json({ message: 'Please wait before requesting another code', retryAfterMs: waitMs });
  }

  const code = generateOtpCode();
  const otp = { code, attempts: 0, sentAt: new Date().toISOString(), expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString() };
  db.get('users').find({ id: user.id }).assign({ otp }).write();

  console.log(`[otp] Verification code for ${user.phone} (${user.name}): ${code} (valid 5 min)`);

  const payload = { message: 'Verification code sent', expiresInMs: OTP_TTL_MS };
  if (process.env.NODE_ENV !== 'production') payload.devCode = code;
  res.json(payload);
});

// POST /auth/otp/verify { code }
router.post('/otp/verify', requireAuth, (req, res) => {
  const { code } = req.body || {};
  const user = db.get('users').find({ id: req.userId }).value();
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.phoneVerified) return res.json({ message: 'Phone already verified', user: publicUser(user) });

  if (!user.otp) {
    return res.status(400).json({ message: 'No verification code was requested. Please resend the code.' });
  }
  if (Date.now() > new Date(user.otp.expiresAt).getTime()) {
    return res.status(400).json({ message: 'This code has expired. Please resend the code.' });
  }
  if (user.otp.attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many incorrect attempts. Please resend the code.' });
  }
  if (String(code || '').trim() !== user.otp.code) {
    db.get('users').find({ id: user.id }).assign({ otp: { ...user.otp, attempts: user.otp.attempts + 1 } }).write();
    return res.status(400).json({ message: 'Incorrect verification code' });
  }

  db.get('users').find({ id: user.id }).assign({ phoneVerified: true, otp: null }).write();
  const updated = db.get('users').find({ id: user.id }).value();
  res.json({ message: 'Phone verified', user: publicUser(updated) });
});

module.exports = router;
module.exports.publicUser = publicUser;
