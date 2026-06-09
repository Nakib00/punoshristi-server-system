require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('./middleware/auth');
const { ADMIN_JWT_SECRET } = require('./middleware/adminAuth');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const machineRoutes = require('./routes/machines');
const adminRoutes = require('./routes/admin');
const createScanRouter = require('./routes/scan');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Socket.IO auth: support both user tokens and admin tokens
io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));

  // Try user token first
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.userId;
    socket.role = 'user';
    return next();
  } catch { /* not a user token */ }

  // Try admin token
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (payload.role === 'admin') {
      socket.role = 'admin';
      return next();
    }
  } catch { /* not an admin token */ }

  next(new Error('Invalid or expired token'));
});

io.on('connection', (socket) => {
  if (socket.role === 'admin') {
    socket.join('admin');
  } else if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scan', createScanRouter(io));

// User's own scan history
const { requireAuth } = require('./middleware/auth');
const db = require('./db');
app.get('/api/my/scans', requireAuth, (req, res) => {
  const scans = db
    .get('scans')
    .filter({ userId: req.userId })
    .value()
    .slice()
    .reverse();
  res.json({ scans });
});

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bottle deposit backend listening on http://0.0.0.0:${PORT}`);
});
