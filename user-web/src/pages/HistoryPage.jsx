import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyActivity } from '../api';
import Icon from '../components/Icon';

const ACTIVITY_ICON = { recycle: 'eco', redemption: 'payments' };

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyActivity(100)
      .then(({ activity: a }) => setActivity(a || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-xl">
      <header className="bg-surface sticky top-0 z-50 flex items-center gap-md px-margin-mobile h-16 w-full">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">History</h1>
      </header>

      <main className="px-margin-mobile pt-md space-y-sm">
        {loading && <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>}
        {!loading && activity.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant">No activity yet.</p>
        )}
        {activity.map((a) => (
          <div key={a.id} className="bg-[#F0FAF2] border border-[#E0F2E4] rounded-xl p-md flex justify-between items-center">
            <div className="flex items-center gap-md min-w-0">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shrink-0">
                <Icon name={ACTIVITY_ICON[a.type] || 'eco'} />
              </div>
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface truncate">{a.title}</p>
                <p className="text-[11px] text-on-surface-variant">{formatDate(a.createdAt)}</p>
              </div>
            </div>
            <span className={`font-title-md text-title-md shrink-0 ${a.pointsDelta >= 0 ? 'text-secondary' : 'text-error'}`}>
              {a.pointsDelta >= 0 ? '+' : ''}
              {a.pointsDelta} pts
            </span>
          </div>
        ))}
      </main>
    </div>
  );
}
