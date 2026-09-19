// Facebook-Ads-style scheduling for kiosk ads: which machines an ad is
// allowed to appear on, an optional date range, optional days-of-week, and
// an optional daily time window. All checks are evaluated against the
// server's local clock (this is a single-timezone local deployment).

function parseTimeToMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isWithinDateRange(ad, now) {
  if (ad.startDate) {
    const start = new Date(`${ad.startDate}T00:00:00`);
    if (now < start) return false;
  }
  if (ad.endDate) {
    const end = new Date(`${ad.endDate}T23:59:59`);
    if (now > end) return false;
  }
  return true;
}

function isWithinDaysOfWeek(ad, now) {
  if (!ad.daysOfWeek || ad.daysOfWeek.length === 0) return true;
  return ad.daysOfWeek.includes(now.getDay()); // 0=Sun..6=Sat
}

function isWithinTimeWindow(ad, now) {
  const start = parseTimeToMinutes(ad.startTime);
  const end = parseTimeToMinutes(ad.endTime);
  if (start === null || end === null) return true;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (start <= end) {
    // Normal same-day window, e.g. 09:00-18:00
    return nowMinutes >= start && nowMinutes < end;
  }
  // Overnight window, e.g. 20:00-02:00
  return nowMinutes >= start || nowMinutes < end;
}

function isTargetingMachine(ad, machineId) {
  if (!ad.machineIds || ad.machineIds.length === 0) return true; // untargeted = all machines
  if (!machineId) return false; // targeted ad, but caller didn't say which machine it is
  return ad.machineIds.includes(machineId);
}

// The single source of truth for "should this ad be in the current loop".
function isAdEligibleNow(ad, machineId, now = new Date()) {
  if (!ad.active) return false;
  if (!isTargetingMachine(ad, machineId)) return false;
  if (!isWithinDateRange(ad, now)) return false;
  if (!isWithinDaysOfWeek(ad, now)) return false;
  if (!isWithinTimeWindow(ad, now)) return false;
  return true;
}

module.exports = { isAdEligibleNow };
