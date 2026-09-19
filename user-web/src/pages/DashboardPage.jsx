import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { fetchMachines, fetchMyActivity, fetchMyStats, fetchPartners } from '../api';
import { haversineKm } from '../lib/geo';
import { formatActivityTitle } from '../lib/activity';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import Icon from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';

const ACTIVITY_ICON = { recycle: 'eco', redemption: 'payments' };

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [machines, setMachines] = useState([]);
  const [partners, setPartners] = useState([]);
  const [coords, setCoords] = useState(null);

  function timeAgo(iso) {
    const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    if (mins < 60) return lang === 'bn' ? `${mins} মিনিট আগে` : `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    const timeStr = new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    if (hours < 24) return lang === 'bn' ? `আজ, ${timeStr}` : `Today, ${timeStr}`;
    const days = Math.floor(hours / 24);
    if (days === 1) return lang === 'bn' ? `গতকাল, ${timeStr}` : `Yesterday, ${timeStr}`;
    return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }

  useEffect(() => {
    fetchMyStats().then(setStats).catch(() => {});
    fetchMyActivity(3).then(({ activity: a }) => setActivity(a || [])).catch(() => {});
    fetchMachines().then(({ machines: m }) => setMachines(m || [])).catch(() => {});
    fetchPartners().then(({ partners: p }) => setPartners(p || [])).catch(() => {});

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const nearest = (() => {
    if (machines.length === 0) return null;
    if (!coords) return machines[0];
    return machines
      .map((m) => ({ ...m, distanceKm: haversineKm(coords.lat, coords.lng, m.lat, m.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  })();

  const featuredPartners = partners.slice(0, 3);
  const firstName = user?.name?.split(' ')[0] || user?.name;

  return (
    <div className="min-h-screen bg-[#F0FAF2] pb-24">
      <TopAppBar />
      <main className="pt-20 px-margin-mobile space-y-lg">
        <section>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {t('dashboard.greeting', { name: firstName })}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.tagline')}</p>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-[#004317] to-[#1a5c2a] rounded-xl p-lg text-white shadow-lg">
          <div className="relative z-10 flex flex-col gap-md">
            <div>
              <span className="font-label-md text-label-md opacity-80">{t('dashboard.ecoBalance')}</span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-headline-xl">{(stats?.points ?? user?.points ?? 0).toLocaleString()}</span>
                <span className="font-title-md text-title-md">{t('dashboard.points')}</span>
              </div>
              <span className="font-body-md text-body-md opacity-90">
                ≈ {Math.round((stats?.points ?? user?.points ?? 0) / 10)} BDT
              </span>
            </div>
            <div className="flex gap-sm flex-wrap">
              <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
                <Icon name="recycling" size="18px" />
                <span className="font-label-md text-label-md">
                  {stats?.bottleCount ?? user?.bottleCount ?? 0} {t('dashboard.bottles')}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
                <Icon name="military_tech" size="18px" />
                <span className="font-label-md text-label-md">
                  {t('dashboard.rank')} #{stats?.rank ?? '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl" />
        </section>

        <section className="grid grid-cols-4 gap-sm">
          {[
            { icon: 'qr_code_scanner', label: t('dashboard.scanQr'), to: '/scan', accent: true },
            { icon: 'map', label: t('dashboard.findRvm'), to: '/map' },
            { icon: 'redeem', label: t('dashboard.redeem'), to: '/partners' },
            { icon: 'leaderboard', label: t('dashboard.ranks'), to: '/leaderboard' },
          ].map((action) => (
            <button key={action.to} className="flex flex-col items-center gap-xs" onClick={() => navigate(action.to)}>
              <div
                className={
                  'w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm hover:opacity-80 transition-opacity ' +
                  (action.accent ? 'bg-secondary-container text-on-secondary-container' : 'bg-white text-primary')
                }
              >
                <Icon name={action.icon} />
              </div>
              <span className="font-label-md text-label-md text-on-surface">{action.label}</span>
            </button>
          ))}
        </section>

        {nearest && (
          <section className="space-y-md">
            <div className="flex justify-between items-center">
              <h2 className="font-title-md text-title-md text-on-surface">{t('dashboard.nearbyMachine')}</h2>
              <button className="font-label-md text-label-md text-secondary" onClick={() => navigate('/map')}>
                {t('dashboard.viewAll')}
              </button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex p-md gap-md items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                <Icon name="recycling" className="text-primary" size="32px" />
              </div>
              <div className="flex-grow flex flex-col gap-xs min-w-0">
                <h3 className="font-title-md text-title-md text-on-surface leading-tight truncate">{nearest.name}</h3>
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <Icon name="near_me" size="16px" />
                  <span className="font-body-md text-body-md">
                    {nearest.distanceKm != null ? t('dashboard.kmAway', { km: nearest.distanceKm.toFixed(1) }) : nearest.location}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-md text-[10px]">
                    {t('dashboard.activeReady')}
                  </span>
                </div>
              </div>
              <button
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md shrink-0"
                onClick={() =>
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}`, '_blank')
                }
              >
                <Icon name="directions" />
              </button>
            </div>
          </section>
        )}

        <section className="space-y-md">
          <h2 className="font-title-md text-title-md text-on-surface">{t('dashboard.recentActivity')}</h2>
          {activity.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.noActivity')}</p>
          ) : (
            <div className="space-y-sm">
              {activity.map((a) => (
                <div key={a.id} className="bg-[#F0FAF2] border border-[#E0F2E4] rounded-xl p-md flex justify-between items-center">
                  <div className="flex items-center gap-md min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shrink-0">
                      <Icon name={ACTIVITY_ICON[a.type] || 'eco'} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">{formatActivityTitle(a, t)}</p>
                      <p className="text-[11px] text-on-surface-variant">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`font-title-md text-title-md shrink-0 ${a.pointsDelta >= 0 ? 'text-secondary' : 'text-error'}`}>
                    {a.pointsDelta >= 0 ? '+' : ''}
                    {a.pointsDelta} {t('dashboard.pts')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {featuredPartners.length > 0 && (
          <section className="space-y-md">
            <h2 className="font-title-md text-title-md text-on-surface">{t('dashboard.exclusiveOffers')}</h2>
            <div className="flex overflow-x-auto gap-md pb-4 hide-scrollbar">
              {featuredPartners.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/partners/${p.id}`)}
                  className="flex-shrink-0 w-64 h-32 rounded-xl relative overflow-hidden bg-gradient-to-br from-primary to-secondary p-md flex flex-col justify-end text-left"
                >
                  <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1">
                    {p.category.toUpperCase()}
                  </span>
                  <h4 className="text-white font-title-md text-title-md leading-tight">{p.name}</h4>
                  <p className="text-white/80 font-label-md text-[10px]">{t('dashboard.fromPoints', { points: p.cheapestOfferCost ?? '—' })}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
