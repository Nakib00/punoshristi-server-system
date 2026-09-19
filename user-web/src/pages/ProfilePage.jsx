import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { fetchMyStats } from '../api';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import Icon from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';

const MENU_ITEMS = [
  { icon: 'redeem', key: 'profile.rewards', to: '/partners' },
  { icon: 'history', key: 'profile.history', to: '/history' },
  { icon: 'location_on', key: 'profile.locations', to: '/map' },
  { icon: 'settings', key: 'profile.settings', to: '/info/settings' },
  { icon: 'privacy_tip', key: 'profile.privacy', to: '/info/privacy' },
  { icon: 'help', key: 'profile.help', to: '/info/help' },
  { icon: 'contact_support', key: 'profile.contact', to: '/info/contact' },
  { icon: 'star', key: 'profile.rate', to: '/info/rate' },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchMyStats().then(setStats).catch(() => {});
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const level = stats?.level;
  const co2 = stats?.co2SavedKgThisMonth ?? 0;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <TopAppBar />
      <main className="mt-20 px-margin-mobile flex flex-col gap-lg">
        <section className="bg-surface-container-lowest rounded-xl p-md shadow-[0px_4px_12px_rgba(0,67,23,0.04)] flex flex-col items-center text-center">
          <div className="relative mb-md">
            <div className="w-24 h-24 rounded-full bg-secondary-container/40 border-4 border-secondary-container flex items-center justify-center">
              <Icon name="person" className="text-on-secondary-container" size="48px" />
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-surface flex items-center justify-center">
              <Icon name="verified" filled size="16px" />
            </div>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary">{user?.name}</h2>
          <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full mt-xs font-label-md text-label-md">
            {t('profile.ecoWarriorLevel', { level: level?.level ?? 1 })}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-md">
          <div className="bg-surface-container-low rounded-xl p-sm flex flex-col items-center shadow-[0px_4px_12px_rgba(0,67,23,0.02)]">
            <Icon name="savings" filled className="text-primary mb-xs" />
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{stats?.points ?? user?.points ?? 0}</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{t('profile.points')}</span>
          </div>
          <div className="bg-surface-container-low rounded-xl p-sm flex flex-col items-center shadow-[0px_4px_12px_rgba(0,67,23,0.02)] border-x border-outline-variant/30">
            <Icon name="eco" filled className="text-primary mb-xs" />
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{stats?.bottleCount ?? user?.bottleCount ?? 0}</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{t('profile.bottles')}</span>
          </div>
          <div className="bg-surface-container-low rounded-xl p-sm flex flex-col items-center shadow-[0px_4px_12px_rgba(0,67,23,0.02)]">
            <Icon name="military_tech" filled className="text-primary mb-xs" />
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">#{stats?.rank ?? '—'}</span>
            <span className="font-label-md text-label-md text-on-surface-variant">{t('profile.rank')}</span>
          </div>
        </section>

        <section className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-lg text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Icon name="forest" filled size="120px" />
          </div>
          <div className="relative z-10">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile mb-sm">{t('profile.greenImpact')}</h3>
            <p className="font-body-md text-body-md opacity-90 mb-md leading-relaxed">{t('profile.co2Message', { co2 })}</p>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-secondary-fixed h-full rounded-full shadow-[0px_0px_8px_rgba(145,247,142,0.6)]" style={{ width: `${level?.progressPercent ?? 0}%` }} />
            </div>
            <div className="flex justify-between mt-2 font-label-md text-label-md opacity-80">
              <span>{t('profile.levelProgress', { level: level?.level ?? 1 })}</span>
              <span>
                {level ? level.lifetimePoints - level.currentLevelFloor : 0}/
                {level?.nextLevelAt != null ? level.nextLevelAt - level.currentLevelFloor : '—'} {t('profile.ptsSuffix')}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,67,23,0.04)] overflow-hidden">
          <div className="flex flex-col">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={item.key}
                onClick={() => navigate(item.to)}
                className={`flex items-center gap-md p-md hover:bg-surface-container transition-colors ${i < MENU_ITEMS.length - 1 ? 'border-b border-surface-variant/50' : ''}`}
              >
                <Icon name={item.icon} className="text-primary" />
                <span className="font-body-lg text-body-lg flex-grow text-left">{t(item.key)}</span>
                <Icon name="chevron_right" className="text-outline" />
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={handleLogout}
          className="w-full py-md bg-error/10 text-error font-headline-lg-mobile text-headline-lg-mobile rounded-full flex items-center justify-center gap-md hover:bg-error/20 transition-colors active:scale-95 duration-200"
        >
          <Icon name="logout" />
          {t('profile.logout')}
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
