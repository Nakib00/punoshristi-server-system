import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { describeAuthError } from '../api';
import logo from '../assets/logo.png';
import Icon from '../components/Icon';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please enter your phone/email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      navigate(user.phoneVerified ? '/dashboard' : '/verify-otp', { replace: true });
    } catch (err) {
      setError(describeAuthError(err, 'Could not log in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="w-full max-w-[440px] mx-auto min-h-screen px-margin-mobile py-xl flex flex-col items-center justify-center space-y-xl">
      <header className="w-full flex flex-col items-center">
        <img alt="Punoshristi Logo" className="w-24 h-24 object-contain mb-lg rounded-full" src={logo} />
      </header>

      <div className="w-full text-center space-y-xs">
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Welcome Back 👋</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Login to check your points and rewards</p>
      </div>

      <form className="w-full flex flex-col space-y-md" onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-xs">
          <label className="font-label-md text-label-md text-on-surface-variant ml-xs" htmlFor="identifier">
            Phone or Email
          </label>
          <input
            id="identifier"
            className="w-full h-14 px-md bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary-container focus:border-secondary outline-none transition-all duration-200 font-body-md text-on-surface"
            placeholder="e.g. 01XXXXXXXXX or email@example.com"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="flex flex-col space-y-xs">
          <label className="font-label-md text-label-md text-on-surface-variant ml-xs" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              className="w-full h-14 px-md pr-xl bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary-container focus:border-secondary outline-none transition-all duration-200 font-body-md text-on-surface"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => setShowPassword((s) => !s)}
            >
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
        </div>

        {error && <p className="text-error font-body-md text-body-md">{error}</p>}

        <button
          className="w-full h-14 bg-primary text-on-primary font-title-md text-title-md rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <footer className="w-full text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Don&apos;t have an account?{' '}
          <Link className="text-secondary font-bold hover:underline" to="/register">
            Register Here
          </Link>
        </p>
      </footer>

      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary-fixed pointer-events-none" />
    </main>
  );
}
