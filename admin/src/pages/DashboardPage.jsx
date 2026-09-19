import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { acknowledgeNotification, fetchNotifications, fetchStats, notifyPartner, SOCKET_URL } from '../api';
import { useAdminAuth } from '../AdminAuthContext';
import Icon from '../components/Icon';

const STAT_ITEMS = [
  { key: 'totalUsers', label: 'Total Users', icon: 'group' },
  { key: 'totalMachines', label: 'Total Machines', icon: 'precision_manufacturing' },
  { key: 'activeMachines', label: 'Active Machines', icon: 'bolt' },
  { key: 'totalScans', label: 'Total Scans', icon: 'qr_code_scanner' },
  { key: 'totalBottlesDeposited', label: 'Bottles Deposited', icon: 'eco', variant: 'highlight' },
  { key: 'pendingAlerts', label: 'Pending Alerts', icon: 'warning', variant: 'warning' },
];

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

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div>
      <h1 className="page-title">Overview</h1>

      {notifications.length > 0 && (
        <div className="alert-box">
          <h3>
            <Icon name="warning" filled size="18px" />
            Machine Capacity Alerts
          </h3>
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
                  <Icon name={n.partnerNotified ? 'check_circle' : 'forward_to_inbox'} size="16px" />
                  {n.partnerNotified ? 'Recycling partner notified' : 'Notify recycling partner'}
                </button>
                <button className="btn-small" onClick={() => handleAcknowledge(n.id)}>
                  <Icon name="check" size="16px" />
                  Acknowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="stat-grid">
        {STAT_ITEMS.map((item) => (
          <div className={`stat-card ${item.variant || ''}`} key={item.key}>
            <div className="stat-card-icon">
              <Icon name={item.icon} />
            </div>
            <p className="stat-label">{item.label}</p>
            <p className="stat-value">{stats?.[item.key] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
