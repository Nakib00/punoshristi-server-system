import { useEffect, useState } from 'react';
import { fetchScans } from '../api';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ScansPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans({ limit: 200 })
      .then(({ scans: list }) => setScans(list || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div>
      <h1 className="page-title">Deposit History ({scans.length})</h1>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Email</th>
              <th>Machine</th>
              <th>Location</th>
              <th>Bottles</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">No deposits yet</td>
              </tr>
            ) : (
              scans.map((s) => (
                <tr key={s.id}>
                  <td>{formatDateTime(s.createdAt)}</td>
                  <td>{s.userName}</td>
                  <td>{s.userEmail}</td>
                  <td>{s.machineName || '-'}</td>
                  <td>{s.machineLocation || '-'}</td>
                  <td><span className="pill">+{s.bottleCount}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
