import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { acknowledgeNotification, fetchNotifications, fetchStats, notifyPartner, SOCKET_URL } from '../api';
import { useAdminAuth } from '../AdminAuthContext';

export default function DashboardPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadData() {
    Promise.all([fetchStats(), fetchNotifications()])
      .then(([statsRes, notifRes]) => {
        setStats(statsRes);
        setNotifications(notifRes.notifications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();

    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('machine-capacity-alert', () => {
      loadData();
    });
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAcknowledge(id) {
    await acknowledgeNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleNotifyPartner(id) {
    const { notification } = await notifyPartner(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? notification : n)));
  }

  if (loading) return <p className="loading-text">লোড হচ্ছে...</p>;

  return (
    <div>
      <h1 className="page-title">ওভারভিউ</h1>

      {notifications.length > 0 && (
        <div className="alert-box">
          <h3>⚠️ মেশিন পূর্ণ হওয়ার সতর্কতা</h3>
          {notifications.map((n) => (
            <div key={n.id} className="alert-item">
              <div>
                <strong>{n.machineName}</strong> — {n.machineLocation}
                <p>{n.message}</p>
              </div>
              <div className="alert-actions">
                <button
                  className="btn-small btn-partner"
                  onClick={() => handleNotifyPartner(n.id)}
                  disabled={n.partnerNotified}
                >
                  {n.partnerNotified ? '✓ পার্টনারকে জানানো হয়েছে' : '📨 ভাঙ্গারিয়া পার্টনারকে মেসেজ পাঠান'}
                </button>
                <button className="btn-small" onClick={() => handleAcknowledge(n.id)}>
                  ✓ পড়া হয়েছে
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">মোট ইউজার</p>
          <p className="stat-value">{stats?.totalUsers ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">মোট মেশিন</p>
          <p className="stat-value">{stats?.totalMachines ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">সক্রিয় মেশিন</p>
          <p className="stat-value">{stats?.activeMachines ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">মোট স্ক্যান</p>
          <p className="stat-value">{stats?.totalScans ?? 0}</p>
        </div>
        <div className="stat-card highlight">
          <p className="stat-label">মোট জমাকৃত বোতল</p>
          <p className="stat-value">{stats?.totalBottlesDeposited ?? 0}</p>
        </div>
        <div className="stat-card warning">
          <p className="stat-label">পেন্ডিং সতর্কতা</p>
          <p className="stat-value">{stats?.pendingAlerts ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
