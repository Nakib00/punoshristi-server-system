// Seeds demo machines (with real Dhaka coordinates) and partner offers so
// the map/partners/leaderboard screens have something meaningful to show
// on a fresh install. Safe to re-run — it only inserts collections that are
// still empty, it never duplicates or overwrites existing data.
const { v4: uuidv4 } = require('uuid');
const db = require('../src/db');

const DEMO_MACHINES = [
  { name: 'IUB Campus — Gate 1', location: 'Bashundhara, Dhaka', address: 'Independent University, Bashundhara R/A', lat: 23.8146, lng: 90.4278, capacity: 500 },
  { name: 'Machine #2', location: 'Gulshan, Dhaka', address: 'Gulshan Avenue, Dhaka 1212', lat: 23.7925, lng: 90.4078, capacity: 500 },
  { name: 'Machine #3', location: 'Motijheel, Dhaka', address: 'Dilkusha C/A, Motijheel, Dhaka', lat: 23.7333, lng: 90.4166, capacity: 400 },
  { name: 'Machine #4', location: 'Dhanmondi, Dhaka', address: 'Road 5, Dhanmondi, Dhaka', lat: 23.7461, lng: 90.3742, capacity: 400 },
];

const DEMO_PARTNERS = [
  {
    name: 'Green Sprout Cafe',
    category: 'Cafe',
    address: '452 Sustain Avenue, Eco District, Dhaka',
    hours: 'Open until 9:00 PM',
    rating: 4.8,
    distanceKm: 0.8,
    featured: true,
    offers: [
      { title: '20% Off Bill', pointsCost: 500, icon: 'percent' },
      { title: 'Free Dessert', pointsCost: 800, icon: 'restaurant' },
      { title: 'BOGO Coffee', pointsCost: 300, icon: 'coffee' },
    ],
  },
  {
    name: 'EcoMart',
    category: 'Grocery',
    address: 'Gulshan 2 Circle, Dhaka',
    hours: 'Open until 10:00 PM',
    rating: 4.6,
    distanceKm: 1.2,
    featured: false,
    offers: [{ title: 'BDT 100 Discount Voucher', pointsCost: 1200, icon: 'local_grocery_store' }],
  },
  {
    name: 'Vibe Threads',
    category: 'Fashion',
    address: 'Bashundhara City, Dhaka',
    hours: 'Open until 8:00 PM',
    rating: 4.4,
    distanceKm: 2.5,
    featured: false,
    offers: [{ title: '15% Off Any Item', pointsCost: 2500, icon: 'checkroom' }],
  },
  {
    name: 'Pure Health Pharmacy',
    category: 'Pharmacy',
    address: 'Dhanmondi 27, Dhaka',
    hours: 'Open 24 hours',
    rating: 4.7,
    distanceKm: 0.5,
    featured: false,
    offers: [{ title: '10% Off Medicine', pointsCost: 800, icon: 'medication' }],
  },
];

function seed() {
  if (db.get('machines').value().length === 0) {
    const now = new Date().toISOString();
    for (const m of DEMO_MACHINES) {
      db.get('machines')
        .push({ id: uuidv4(), ...m, currentBottles: 0, active: true, createdAt: now })
        .write();
    }
    console.log(`Seeded ${DEMO_MACHINES.length} demo machines.`);
  } else {
    console.log('Machines already exist — skipping machine seed.');
  }

  if (db.get('partners').value().length === 0) {
    const now = new Date().toISOString();
    for (const p of DEMO_PARTNERS) {
      const offers = p.offers.map((o) => ({ id: uuidv4(), ...o }));
      db.get('partners')
        .push({ id: uuidv4(), ...p, offers, createdAt: now })
        .write();
    }
    console.log(`Seeded ${DEMO_PARTNERS.length} demo partners.`);
  } else {
    console.log('Partners already exist — skipping partner seed.');
  }
}

seed();
