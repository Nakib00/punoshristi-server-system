import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchMyStats } from '../api';
import Icon from '../components/Icon';

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!result) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchMyStats().then(setStats).catch(() => {});
  }, [result, navigate]);

  if (!result) return null;

  const nextThreshold = stats?.level?.nextLevelAt;
  const toNext = nextThreshold ? Math.max(0, nextThreshold - stats.level.lifetimePoints) : null;

  return (
    <div className="bg-primary-container text-white overflow-x-hidden min-h-screen flex flex-col justify-center items-center px-margin-mobile relative">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(147,214,151,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />

      <main className="w-full max-w-md flex flex-col items-center text-center z-10">
        <div className="relative mb-xl">
          <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center shadow-lg shadow-primary/40">
            <Icon name="check_circle" className="text-on-secondary-container" size="48px" />
          </div>
          <div className="absolute -top-4 -left-4">
            <Icon name="eco" className="text-primary-fixed opacity-80 rotate-12" size="24px" />
          </div>
          <div className="absolute -bottom-2 -right-6">
            <Icon name="eco" className="text-primary-fixed opacity-60 -rotate-45" size="32px" />
          </div>
        </div>

        <h1 className="font-headline-xl text-headline-xl text-white mb-xs">+{result.earnedPoints} Points Earned! 🎉</h1>
        <p className="font-body-lg text-body-lg text-primary-fixed/90 mb-xl">
          {result.addedBottles} bottle{result.addedBottles === 1 ? '' : 's'} recycled successfully
        </p>

        <div className="w-full bg-white rounded-xl p-lg shadow-2xl flex flex-col gap-md mb-xl text-on-surface">
          <div className="grid grid-cols-3 gap-sm">
            <div className="flex flex-col items-center">
              <span className="text-on-surface-variant font-label-md text-label-md mb-xs">Total Points</span>
              <span className="text-primary font-headline-lg-mobile text-headline-lg-mobile">{result.points}</span>
            </div>
            <div className="flex flex-col items-center border-x border-outline-variant/30">
              <span className="text-on-surface-variant font-label-md text-label-md mb-xs">Bottles Today</span>
              <span className="text-primary font-headline-lg-mobile text-headline-lg-mobile">{stats?.bottlesToday ?? '—'}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-on-surface-variant font-label-md text-label-md mb-xs">Current Rank</span>
              <span className="text-primary font-headline-lg-mobile text-headline-lg-mobile">#{stats?.rank ?? '—'}</span>
            </div>
          </div>
          <hr className="border-outline-variant/20" />
          <div className="flex flex-col gap-xs text-left">
            <div className="flex justify-between items-center">
              <span className="text-on-surface font-title-md text-title-md">
                {toNext !== null ? `Road to Level ${stats.level.level + 1}` : 'Max Level Reached'}
              </span>
              {toNext !== null && (
                <span className="text-on-surface-variant font-label-md text-label-md">{toNext} pts to go</span>
              )}
            </div>
            <div className="w-full h-2.5 bg-secondary-container/30 rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: `${stats?.level?.progressPercent ?? 0}%` }} />
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-md">
          <button
            onClick={() => navigate('/scan', { replace: true })}
            className="w-full h-14 bg-secondary-container text-on-secondary-container font-title-md text-title-md rounded-full flex items-center justify-center gap-base active:scale-95 transition-transform"
          >
            <Icon name="add_circle" />
            Recycle Another
          </button>
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full h-14 bg-transparent border-2 border-white/30 text-white font-title-md text-title-md rounded-full flex items-center justify-center gap-base active:scale-95 transition-transform hover:bg-white/10"
          >
            <Icon name="dashboard" />
            Go To Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
