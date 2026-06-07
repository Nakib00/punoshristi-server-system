import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    </div>
  );
}
