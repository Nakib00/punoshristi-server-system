// Punoshristi points/rewards economy.
//
// One recycled bottle/can (as counted by the operator at the RVM) is worth a
// fixed number of Eco-Points. Points are a spendable balance (redeemed at
// partner offers); bottleCount is a lifetime, never-decreasing stat used for
// ranking and impact reporting.

const POINTS_PER_BOTTLE = 5;

// Rough, commonly-cited estimate for CO2 avoided by recycling one PET
// bottle instead of it going to landfill/incineration. Presented as an
// approximation in the UI ("~"), not a precise measurement.
const CO2_KG_PER_BOTTLE = 0.1;

// Lifetime-points thresholds that unlock each Eco Warrior level.
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 8000];

function pointsForBottles(bottleCount) {
  return Math.max(0, Math.round(bottleCount)) * POINTS_PER_BOTTLE;
}

function co2SavedKg(bottleCount) {
  return Math.round(Math.max(0, bottleCount) * CO2_KG_PER_BOTTLE * 10) / 10;
}

// Level is derived from lifetime points earned (not current spendable
// balance), so redeeming rewards never demotes a user.
function levelInfo(lifetimePoints) {
  const points = Math.max(0, lifetimePoints || 0);
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const floor = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null;
  const progressInLevel = points - floor;
  const levelSpan = nextThreshold !== null ? nextThreshold - floor : null;
  const progressPercent = levelSpan ? Math.min(100, Math.round((progressInLevel / levelSpan) * 100)) : 100;

  return {
    level,
    lifetimePoints: points,
    currentLevelFloor: floor,
    nextLevelAt: nextThreshold,
    progressPercent,
  };
}

module.exports = { POINTS_PER_BOTTLE, CO2_KG_PER_BOTTLE, LEVEL_THRESHOLDS, pointsForBottles, co2SavedKg, levelInfo };
