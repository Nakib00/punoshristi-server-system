import { useEffect, useState } from 'react';
import { fetchUsers } from '../api';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then(({ users: list }) => setUsers(list || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-text">লোড হচ্ছে...</p>;

  return (
    <div>
      <h1 className="page-title">ইউজারগণ ({users.length})</h1>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>নাম</th>
              <th>ইমেইল</th>
              <th>ফোন</th>
              <th>মোট পয়েন্ট (বোতল)</th>
              <th>মোট স্ক্যান</th>
              <th>রেজিস্ট্রেশনের তারিখ</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">কোনো ইউজার নেই</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td><span className="pill">{u.bottleCount}</span></td>
                  <td>{u.totalScans}</td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
