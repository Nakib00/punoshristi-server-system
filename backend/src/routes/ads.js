const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');
const { isAdEligibleNow } = require('../lib/adSchedule');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'ads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const ALLOWED_MIME = /^image\/(jpeg|png|webp|gif)$|^video\/mp4$/;
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB — kiosk plays local mp4 loops
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.test(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG/WEBP/GIF images or MP4 video are allowed'));
    }
    cb(null, true);
  },
});

const router = express.Router();

// Array/JSON fields arrive as strings over multipart/form-data (file
// upload) but as real arrays over a JSON PUT — accept both.
function parseArrayField(value, mapper = (x) => x) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(mapper);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(mapper) : [];
  } catch {
    return [];
  }
}

function publicAd(ad) {
  return {
    id: ad.id,
    title: ad.title,
    type: ad.type,
    url: `/uploads/ads/${ad.filename}`,
    durationSeconds: ad.durationSeconds,
    order: ad.order,
    active: ad.active,
    machineIds: ad.machineIds || [],
    startDate: ad.startDate || null,
    endDate: ad.endDate || null,
    daysOfWeek: ad.daysOfWeek || [],
    startTime: ad.startTime || null,
    endTime: ad.endTime || null,
  };
}

// Public: the kiosk's idle-screen playlist for one machine — only ads that
// are active, targeted at this machine (or untargeted = all machines), and
// currently inside their date/day/time schedule window.
router.get('/', (req, res) => {
  const { machineId } = req.query;
  const now = new Date();
  const ads = db
    .get('ads')
    .value()
    .filter((ad) => isAdEligibleNow(ad, machineId, now))
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(publicAd);
  res.json({ ads });
});

// Admin: full list (including inactive/out-of-schedule), for the management screen.
router.get('/admin/all', requireAdmin, (req, res) => {
  const ads = db.get('ads').value().slice().sort((a, b) => a.order - b.order).map(publicAd);
  res.json({ ads });
});

// Admin: upload a new ad (multipart/form-data)
router.post('/', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'A file is required' });

  const { title, durationSeconds, machineIds, startDate, endDate, daysOfWeek, startTime, endTime } = req.body || {};
  const type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const maxOrder = db.get('ads').value().reduce((max, a) => Math.max(max, a.order), -1);

  const ad = {
    id: uuidv4(),
    title: title ? String(title).trim() : req.file.originalname,
    type,
    filename: req.file.filename,
    // Videos play to completion; images use this display duration.
    durationSeconds: type === 'image' ? Number(durationSeconds) || 8 : null,
    order: maxOrder + 1,
    active: true,
    // Targeting/scheduling — all optional; absent = show everywhere, always.
    machineIds: parseArrayField(machineIds, String) || [],
    startDate: startDate || null,
    endDate: endDate || null,
    daysOfWeek: parseArrayField(daysOfWeek, Number) || [],
    startTime: startTime || null,
    endTime: endTime || null,
    createdAt: new Date().toISOString(),
  };
  db.get('ads').push(ad).write();
  res.status(201).json({ ad: publicAd(ad) });
});

// Admin: update metadata/order/schedule/targeting (JSON body)
router.put('/:id', requireAdmin, (req, res) => {
  const ad = db.get('ads').find({ id: req.params.id }).value();
  if (!ad) return res.status(404).json({ message: 'Ad not found' });

  const { title, durationSeconds, order, active, machineIds, startDate, endDate, daysOfWeek, startTime, endTime } =
    req.body || {};
  const updates = {};
  if (title !== undefined) updates.title = String(title).trim();
  if (durationSeconds !== undefined) updates.durationSeconds = Number(durationSeconds) || 8;
  if (order !== undefined) updates.order = Number(order);
  if (active !== undefined) updates.active = Boolean(active);
  if (machineIds !== undefined) updates.machineIds = parseArrayField(machineIds, String) || [];
  if (startDate !== undefined) updates.startDate = startDate || null;
  if (endDate !== undefined) updates.endDate = endDate || null;
  if (daysOfWeek !== undefined) updates.daysOfWeek = parseArrayField(daysOfWeek, Number) || [];
  if (startTime !== undefined) updates.startTime = startTime || null;
  if (endTime !== undefined) updates.endTime = endTime || null;

  db.get('ads').find({ id: req.params.id }).assign(updates).write();
  res.json({ ad: publicAd(db.get('ads').find({ id: req.params.id }).value()) });
});

// Admin: delete an ad and its uploaded file.
router.delete('/:id', requireAdmin, (req, res) => {
  const ad = db.get('ads').find({ id: req.params.id }).value();
  if (!ad) return res.status(404).json({ message: 'Ad not found' });

  const filePath = path.join(UPLOAD_DIR, ad.filename);
  fs.unlink(filePath, () => {}); // best-effort cleanup

  db.get('ads').remove({ id: req.params.id }).write();
  res.json({ message: 'Ad deleted' });
});

module.exports = router;
