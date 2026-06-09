import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { describeAuthError } from '../api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('ইমেইল/ফোন নম্বর ও পাসওয়ার্ড দিন');
      return;
    }
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(describeAuthError(err, 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>লগইন করুন</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          ইমেইল অথবা ফোন নম্বর
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com অথবা 01712345678"
            autoComplete="username"
            inputMode="email"
          />
        </label>
        <label>
          পাসওয়ার্ড
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'অপেক্ষা করুন...' : 'লগইন'}
        </button>
      </form>
      <p className="auth-switch">
        অ্যাকাউন্ট নেই? <Link to="/register">রেজিস্ট্রেশন করুন</Link>
      </p>
    </div>
  );
}
