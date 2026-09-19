const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');

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

function publicAd(ad) {
  return {
    id: ad.id,
    title: ad.title,
    type: ad.type,
    url: `/uploads/ads/${ad.filename}`,
    durationSeconds: ad.durationSeconds,
    order: ad.order,
    active: ad.active,
  };
}

// Public: the kiosk's idle-screen playlist — active ads only, in display order.
router.get('/', (req, res) => {
  const ads = db
    .get('ads')
    .filter({ active: true })
    .value()
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(publicAd);
  res.json({ ads });
});

// Admin: full list (including inactive), for the management screen.
router.get('/admin/all', requireAdmin, (req, res) => {
  const ads = db.get('ads').value().slice().sort((a, b) => a.order - b.order).map(publicAd);
  res.json({ ads });
});

// Admin: upload a new ad (multipart/form-data: file, title, durationSeconds)
router.post('/', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'A file is required' });

  const { title, durationSeconds } = req.body || {};
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
    createdAt: new Date().toISOString(),
  };
  db.get('ads').push(ad).write();
  res.status(201).json({ ad: publicAd(ad) });
});

// Admin: update metadata (title, duration, order, active)
router.put('/:id', requireAdmin, (req, res) => {
  const ad = db.get('ads').find({ id: req.params.id }).value();
  if (!ad) return res.status(404).json({ message: 'Ad not found' });

  const { title, durationSeconds, order, active } = req.body || {};
  const updates = {};
  if (title !== undefined) updates.title = String(title).trim();
  if (durationSeconds !== undefined) updates.durationSeconds = Number(durationSeconds) || 8;
  if (order !== undefined) updates.order = Number(order);
  if (active !== undefined) updates.active = Boolean(active);

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
