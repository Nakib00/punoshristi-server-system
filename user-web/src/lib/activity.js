// Builds a localized activity-feed title from the structured fields the
// backend returns (bottleCount/machineName or offerTitle/partnerName),
// instead of using the server's English-only pre-formatted `title`.
export function formatActivityTitle(a, t) {
  if (a.type === 'redemption') {
    return t('activity.redeemed', { offer: a.offerTitle, partner: a.partnerName });
  }
  const plural = a.bottleCount === 1 ? '' : 's';
  return a.machineName
    ? t('activity.recycledWithMachine', { count: a.bottleCount, plural, machine: a.machineName })
    : t('activity.recycledNoMachine', { count: a.bottleCount, plural });
}
