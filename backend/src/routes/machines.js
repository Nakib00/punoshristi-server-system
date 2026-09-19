const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('../middleware/adminAuth');
const { derivePosition } = require('../lib/geo');

const router = express.Router();

// Attach real lat/lng if an admin set them, otherwise a stable derived
// position, so the map always has something plottable for every machine.
function withPosition(machine) {
  const hasCoords = typeof machine.lat === 'number' && typeof machine.lng === 'number';
  const position = hasCoords ? { lat: machine.lat, lng: machine.lng } : derivePosition(machine.id);
  const fillPercent = machine.capacity > 0 ? Math.round((machine.currentBottles / machine.capacity) * 100) : 0;
  const status = !machine.active ? 'offline' : fillPercent >= 80 ? 'almost_full' : 'active';
  return { ...machine, ...position, hasPreciseLocation: hasCoords, fillPercent, status };
}

// Public: GET all active machines (for operator machine-selector dropdown
// and the user-facing map/nearby-machine features)
router.get('/', (req, res) => {
  const machines = db.get('machines').filter({ active: true }).value().map(withPosition);
  res.json({ machines });
});

// Admin: GET all machines (including inactive)
router.get('/all', requireAdmin, (req, res) => {
  const machines = db.get('machines').value().map(withPosition);
  res.json({ machines });
});

// Admin: create machine
router.post('/', requireAdmin, (req, res) => {
  const { name, location, address, capacity, lat, lng } = req.body || {};
  if (!name || !location) {
    return res.status(400).json({ message: 'Machine name and location are required' });
  }
  const cap = Number(capacity);
  const machine = {
    id: uuidv4(),
    name: String(name).trim(),
    location: String(location).trim(),
    address: address ? String(address).trim() : '',
    capacity: Number.isFinite(cap) && cap > 0 ? cap : 500,
    currentBottles: 0,
    active: true,
    lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
    lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
    createdAt: new Date().toISOString(),
  };
  db.get('machines').push(machine).write();
  res.status(201).json({ machine: withPosition(machine) });
});

// Admin: update machine
router.put('/:id', requireAdmin, (req, res) => {
  const machine = db.get('machines').find({ id: req.params.id }).value();
  if (!machine) return res.status(404).json({ message: 'Machine not found' });

  const { name, location, address, capacity, active, currentBottles, lat, lng } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (location !== undefined) updates.location = String(location).trim();
  if (address !== undefined) updates.address = String(address).trim();
  if (capacity !== undefined) {
    const cap = Number(capacity);
    if (Number.isFinite(cap) && cap > 0) updates.capacity = cap;
  }
  if (active !== undefined) updates.active = Boolean(active);
  if (lat !== undefined) updates.lat = lat === null || lat === '' ? null : Number(lat);
  if (lng !== undefined) updates.lng = lng === null || lng === '' ? null : Number(lng);
  // Allow emptying the machine
  if (currentBottles !== undefined && Number(currentBottles) === 0) {
    updates.currentBottles = 0;
  }

  db.get('machines').find({ id: req.params.id }).assign(updates).write();
  const updated = db.get('machines').find({ id: req.params.id }).value();
  res.json({ machine: withPosition(updated) });
});

// Admin: delete machine
router.delete('/:id', requireAdmin, (req, res) => {
  const machine = db.get('machines').find({ id: req.params.id }).value();
  if (!machine) return res.status(404).json({ message: 'Machine not found' });
  db.get('machines').remove({ id: req.params.id }).write();
  res.json({ message: 'Machine deleted' });
});

module.exports = router;
