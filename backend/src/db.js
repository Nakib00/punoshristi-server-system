const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(path.join(dataDir, 'db.json'));
const db = low(adapter);

db.defaults({
  users: [],
  sessions: [],
  machines: [],
  scans: [],
  notifications: [],
  partners: [],
  redemptions: [],
  ads: [],
}).write();

// One-time, idempotent backfill for accounts created before the
// points/rewards system existed. Only fills in fields that are missing —
// never overwrites a real spendable `points` balance once it exists.
const { pointsForBottles } = require('./lib/points');
let migrated = false;
db.get('users')
  .value()
  .forEach((user) => {
    const patch = {};
    if (user.points === undefined) patch.points = pointsForBottles(user.bottleCount || 0);
    // Accounts created before phone verification existed never went
    // through it — don't retroactively lock them out of the app.
    if (user.phoneVerified === undefined) patch.phoneVerified = true;
    if (user.favorites === undefined) patch.favorites = [];
    if (user.otp === undefined) patch.otp = null;
    if (Object.keys(patch).length) {
      db.get('users').find({ id: user.id }).assign(patch).write();
      migrated = true;
    }
  });
if (migrated) console.log('[db] Backfilled legacy user accounts with points/phoneVerified/favorites.');

module.exports = db;
