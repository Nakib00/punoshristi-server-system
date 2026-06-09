import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { fetchScanHistory } from '../api';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('bn-BD', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);

  useEffect(() => {
    fetchScanHistory()
      .then(({ scans: list }) => setScans(list || []))
      .catch(() => {})
      .finally(() => setLoadingScans(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="greeting">স্বাগতম,</p>
          <h1>{user?.name}</h1>
          {user?.phone && <p className="user-phone">📞 {user.phone}</p>}
        </div>
        <button className="btn-ghost" onClick={handleLogout}>লগআউট</button>
      </div>

      <div className="count-card">
        <p className="count-label">আপনার মোট বোতল সংখ্যা</p>
        <p className="count-value">{user?.bottleCount ?? 0}</p>
      </div>

      <button className="btn-primary btn-scan" onClick={() => navigate('/scan')}>
        📷 QR কোড স্ক্যান করুন
      </button>

      <p className="hint">
        মেশিনে বোতল জমা দেওয়ার পর স্ক্রিনে যে QR কোড দেখানো হবে, সেটি স্ক্যান করলে সাথে সাথে আপনার অ্যাকাউন্টে বোতলের সংখ্যা যোগ হয়ে যাবে।
      </p>

      {/* Scan history */}
      <div className="history-section">
        <h2 className="history-title">জমার ইতিহাস</h2>
        {loadingScans ? (
          <p className="history-empty">লোড হচ্ছে...</p>
        ) : scans.length === 0 ? (
          <p className="history-empty">এখনো কোনো বোতল জমা দেওয়া হয়নি।</p>
        ) : (
          <ul className="history-list">
            {scans.map((scan) => (
              <li key={scan.id} className="history-item">
                <div className="history-item-main">
                  <span className="history-bottles">+{scan.bottleCount} 🍾</span>
                  <span className="history-date">{formatDate(scan.createdAt)}</span>
                </div>
                {scan.machineName && (
                  <div className="history-machine">
                    📍 {scan.machineName} — {scan.machineLocation}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
