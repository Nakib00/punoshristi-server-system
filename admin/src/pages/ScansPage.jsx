import { useEffect, useState } from 'react';
import { fetchScans } from '../api';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('bn-BD', {
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

  if (loading) return <p className="loading-text">লোড হচ্ছে...</p>;

  return (
    <div>
      <h1 className="page-title">জমার ইতিহাস ({scans.length})</h1>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>সময়</th>
              <th>ইউজার</th>
              <th>ইমেইল</th>
              <th>মেশিন</th>
              <th>লোকেশন</th>
              <th>বোতল</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">এখনো কোনো জমা হয়নি</td>
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
