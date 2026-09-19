// Lightweight geo helpers for the machine map — no external geocoding
// service required.

// Roughly the center of Dhaka, used as the fallback anchor point for
// machines that haven't had real GPS coordinates set by an admin yet.
const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };

function hashToUnit(id) {
  let hash = 0;
  const str = String(id || '');
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash / 0xffffffff; // 0..1
}

// Deterministic pseudo-position so a machine without stored coordinates
// still renders at a stable spot on the map (never jumps between requests)
// instead of stacking every un-mapped machine on top of each other.
function derivePosition(id) {
  const angle = hashToUnit(`${id}-angle`) * Math.PI * 2;
  const radius = 0.01 + hashToUnit(`${id}-radius`) * 0.04; // ~1-5km spread
  return {
    lat: Math.round((DHAKA_CENTER.lat + radius * Math.sin(angle)) * 1e6) / 1e6,
    lng: Math.round((DHAKA_CENTER.lng + radius * Math.cos(angle)) * 1e6) / 1e6,
  };
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => typeof v !== 'number' || Number.isNaN(v))) return null;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

module.exports = { DHAKA_CENTER, derivePosition, distanceKm };
