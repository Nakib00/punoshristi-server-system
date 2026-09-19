import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboard, fetchMyRank } from '../api';
import { useAuth } from '../AuthContext';
import BottomNav from '../components/BottomNav';
import Icon from '../components/Icon';

const RANGES = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const PODIUM_STYLE = {
  1: { height: 'h-36', bg: 'bg-primary text-white', avatarSize: 'w-20 h-20', border: 'border-secondary-fixed', scale: 'scale-110 z-10' },
  2: { height: 'h-24', bg: 'bg-surface-container-highest text-on-surface', avatarSize: 'w-16 h-16', border: 'border-surface-variant', scale: '' },
  3: { height: 'h-20', bg: 'bg-surface-container text-on-surface', avatarSize: 'w-16 h-16', border: 'border-on-tertiary-container', scale: '' },
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState('week');
  const [board, setBoard] = useState({ leaderboard: [], totalUsers: 0 });
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard(range).then(setBoard).catch(() => {});
    fetchMyRank(range).then(setMyRank).catch(() => {});
  }, [range]);

  const podium = board.leaderboard.slice(0, 3);
  const order = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;
  const rest = board.leaderboard.slice(3);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="bg-surface sticky top-0 z-50 flex justify-between items-center px-margin-mobile h-16 w-full">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">Leaderboard</h1>
        <div className="w-10" />
      </header>

      <main className="px-margin-mobile">
        <section className="flex gap-sm py-md overflow-x-auto hide-scrollbar">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={
                'px-lg py-sm rounded-full font-label-md text-label-md transition-colors whitespace-nowrap ' +
                (range === r.key ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high')
              }
            >
              {r.label}
            </button>
          ))}
        </section>

        {order.length > 0 ? (
          <section className="mt-lg flex items-end justify-center gap-base mb-xl">
            {order.map((u) => {
              const style = PODIUM_STYLE[u.rank];
              return (
                <div key={u.id} className={`flex flex-col items-center flex-1 ${style.scale}`}>
                  <div className="relative mb-base">
                    <div className={`${style.avatarSize} rounded-full border-4 ${style.border} bg-surface-container-highest flex items-center justify-center overflow-hidden`}>
                      <Icon name="person" className="text-on-surface-variant" size="32px" />
                    </div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Icon name="workspace_premium" filled={u.rank === 1} className={u.rank === 1 ? 'text-secondary' : 'text-surface-variant'} size={u.rank === 1 ? '32px' : '24px'} />
                    </div>
                  </div>
                  <div className={`${style.bg} w-full rounded-t-xl ${style.height} flex flex-col items-center pt-md shadow-sm`}>
                    <span className="font-bold text-label-md text-center px-xs truncate w-full">{u.name}</span>
                    <span className="font-bold text-label-md mt-xs">{u.points.toLocaleString()} pts</span>
                    <span className="font-extrabold text-[24px] mt-base">{u.rank}</span>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <p className="mt-lg mb-xl font-body-md text-body-md text-on-surface-variant text-center">
            No recycling activity yet for this period.
          </p>
        )}

        {myRank && myRank.rank && (
          <section className="mb-xl">
            <div className="bg-[#F0FAF2] p-md rounded-xl flex items-center justify-between border border-[#E0F2E4] shadow-[0px_4px_12px_rgba(0,67,23,0.04)]">
              <div className="flex items-center gap-md">
                <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-label-md">
                  #{myRank.rank}
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">You</h3>
                  <p className="font-label-md text-label-md text-on-surface-variant">{myRank.totalUsers} recyclers ranked</p>
                </div>
              </div>
              <span className="font-bold text-primary text-title-md">{myRank.points.toLocaleString()} pts</span>
            </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-center mb-md">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">Top Recyclers</h2>
            <span className="text-on-surface-variant text-label-md font-label-md">{board.totalUsers} Users</span>
          </div>
          <div className="flex flex-col gap-sm">
            {rest.map((u) => (
              <div key={u.id} className={`flex items-center justify-between p-sm rounded-xl ${u.id === user?.id ? 'bg-secondary-container/20' : 'hover:bg-surface-container-low'} transition-colors`}>
                <div className="flex items-center gap-md min-w-0">
                  <span className="w-6 font-extrabold text-on-surface-variant shrink-0">{u.rank}</span>
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                    <Icon name="person" className="text-on-surface-variant" />
                  </div>
                  <span className="font-bold text-on-surface truncate">{u.name}</span>
                </div>
                <span className="font-bold text-on-surface-variant shrink-0">{u.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
