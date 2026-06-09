import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { describeAuthError } from '../api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক');
      return;
    }
    if (phone && !/^\d{11}$/.test(phone.trim())) {
      setError('ফোন নম্বর অবশ্যই ঠিক ১১ সংখ্যার হতে হবে (যেমন: 01712345678)');
      return;
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে');
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, phone.trim() || undefined);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(describeAuthError(err, 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>রেজিস্ট্রেশন করুন</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          নাম
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার পুরো নাম"
            autoComplete="name"
          />
        </label>
        <label>
          ইমেইল
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label>
          ফোন নম্বর <span className="optional-tag">(ঐচ্ছিক)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="01712345678"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={11}
          />
        </label>
        <label>
          পাসওয়ার্ড
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="অন্তত ৬ অক্ষর"
            autoComplete="new-password"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'অপেক্ষা করুন...' : 'অ্যাকাউন্ট তৈরি করুন'}
        </button>
      </form>
      <p className="auth-switch">
        অ্যাকাউন্ট আছে? <Link to="/login">লগইন করুন</Link>
      </p>
    </div>
  );
}
