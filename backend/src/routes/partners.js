const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

module.exports = function createPartnersRouter(io) {
  const router = express.Router();

  function cheapestOfferCost(partner) {
    const offers = partner.offers || [];
    if (!offers.length) return null;
    return Math.min(...offers.map((o) => o.pointsCost));
  }

  function publicPartner(partner) {
    return { ...partner, cheapestOfferCost: cheapestOfferCost(partner) };
  }

  // Public: list all partners
  router.get('/', (req, res) => {
    const partners = db.get('partners').value().map(publicPartner);
    res.json({ partners });
  });

  // Public: single partner with offers
  router.get('/:id', (req, res) => {
    const partner = db.get('partners').find({ id: req.params.id }).value();
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    res.json({ partner: publicPartner(partner) });
  });

  // Auth: redeem one of a partner's offers with points
  router.post('/:id/redeem', requireAuth, (req, res) => {
    const { offerId } = req.body || {};
    const partner = db.get('partners').find({ id: req.params.id }).value();
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    const offer = (partner.offers || []).find((o) => o.id === offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const user = db.get('users').find({ id: req.userId }).value();
    if (!user) return res.status(404).json({ message: 'User not found' });

    if ((user.points || 0) < offer.pointsCost) {
      return res.status(400).json({ message: 'Not enough points for this offer' });
    }

    const newPoints = (user.points || 0) - offer.pointsCost;
    db.get('users').find({ id: user.id }).assign({ points: newPoints }).write();

    const redemption = {
      id: uuidv4(),
      userId: user.id,
      partnerId: partner.id,
      partnerName: partner.name,
      offerId: offer.id,
      offerTitle: offer.title,
      pointsCost: offer.pointsCost,
      createdAt: new Date().toISOString(),
    };
    db.get('redemptions').push(redemption).write();

    io.to(`user:${user.id}`).emit('points-updated', { points: newPoints, reason: 'redemption', redemption });

    res.json({ message: 'Offer redeemed', points: newPoints, redemption });
  });

  // --- Admin management -------------------------------------------------

  router.get('/admin/all', requireAdmin, (req, res) => {
    res.json({ partners: db.get('partners').value() });
  });

  router.post('/', requireAdmin, (req, res) => {
    const { name, category, address, hours, rating, featured, distanceKm } = req.body || {};
    if (!name || !category) {
      return res.status(400).json({ message: 'Partner name and category are required' });
    }
    const partner = {
      id: uuidv4(),
      name: String(name).trim(),
      category: String(category).trim(),
      address: address ? String(address).trim() : '',
      hours: hours ? String(hours).trim() : '',
      rating: Number.isFinite(Number(rating)) ? Number(rating) : 4.5,
      distanceKm: Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : null,
      featured: Boolean(featured),
      offers: [],
      createdAt: new Date().toISOString(),
    };
    db.get('partners').push(partner).write();
    res.status(201).json({ partner });
  });

  router.put('/:id', requireAdmin, (req, res) => {
    const partner = db.get('partners').find({ id: req.params.id }).value();
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    const { name, category, address, hours, rating, featured, distanceKm } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (category !== undefined) updates.category = String(category).trim();
    if (address !== undefined) updates.address = String(address).trim();
    if (hours !== undefined) updates.hours = String(hours).trim();
    if (rating !== undefined) updates.rating = Number(rating);
    if (featured !== undefined) updates.featured = Boolean(featured);
    if (distanceKm !== undefined) updates.distanceKm = Number(distanceKm);
    db.get('partners').find({ id: req.params.id }).assign(updates).write();
    res.json({ partner: db.get('partners').find({ id: req.params.id }).value() });
  });

  router.delete('/:id', requireAdmin, (req, res) => {
    const partner = db.get('partners').find({ id: req.params.id }).value();
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    db.get('partners').remove({ id: req.params.id }).write();
    res.json({ message: 'Partner deleted' });
  });

  router.post('/:id/offers', requireAdmin, (req, res) => {
    const partner = db.get('partners').find({ id: req.params.id }).value();
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    const { title, pointsCost, icon } = req.body || {};
    if (!title || !Number.isFinite(Number(pointsCost))) {
      return res.status(400).json({ message: 'Offer title and pointsCost are required' });
    }
    const offer = { id: uuidv4(), title: String(title).trim(), pointsCost: Number(pointsCost), icon: icon || 'redeem' };
    const offers = [...(partner.offers || []), offer];
    db.get('partners').find({ id: req.params.id }).assign({ offers }).write();
    res.status(201).json({ offer });
  });

  router.delete('/:id/offers/:offerId', requireAdmin, (req, res) => {
    const partner = db.get('partners').find({ id: req.params.id }).value();
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    const offers = (partner.offers || []).filter((o) => o.id !== req.params.offerId);
    db.get('partners').find({ id: req.params.id }).assign({ offers }).write();
    res.json({ message: 'Offer removed' });
  });

  return router;
};
