import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { sendOtp, verifyOtp } from '../api';
import Icon from '../components/Icon';

const RESEND_COOLDOWN_S = 45;

export default function OtpVerificationPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (user?.phoneVerified) {
      navigate('/dashboard', { replace: true });
      return;
    }
    requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function requestCode() {
    setError('');
    setSending(true);
    try {
      const res = await sendOtp();
      setInfo(res.devCode ? `Dev mode: your code is ${res.devCode} (no SMS gateway configured yet)` : 'Verification code sent.');
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send verification code.');
    } finally {
      setSending(false);
    }
  }

  function handleDigitChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setVerifying(true);
    try {
      const { user: verifiedUser } = await verifyOtp(code);
      updateUser(verifiedUser);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      <main className="min-h-screen flex flex-col items-center px-margin-mobile pt-xl pb-xl">
        <div className="mb-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-secondary-container flex items-center justify-center rounded-full mb-lg shadow-sm">
            <Icon name="lock" filled size="40px" className="text-on-secondary-container" />
          </div>
          <div className="text-center max-w-sm">
            <h1 className="font-headline-xl text-headline-xl text-primary mb-sm">Verify Your Number</h1>
            <p className="font-body-md text-on-surface-variant px-md">
              We sent a 6-digit code to <span className="font-bold text-on-surface">+88{user?.phone}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="w-full flex flex-col items-center">
          <div className="grid grid-cols-6 gap-xs md:gap-sm mb-xl max-w-md w-full">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className="w-full aspect-square border-2 border-outline-variant bg-white text-center font-headline-lg text-primary rounded-xl transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary-container"
                maxLength={1}
                inputMode="numeric"
                placeholder="•"
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-xs mb-xl">
            {info && <p className="font-body-md text-secondary text-center max-w-sm">{info}</p>}
            {error && <p className="font-body-md text-error text-center max-w-sm">{error}</p>}
            <div className="flex items-center gap-sm mt-xs">
              <button
                type="button"
                className="font-label-md text-secondary hover:underline transition-all disabled:opacity-50 disabled:no-underline"
                disabled={cooldown > 0 || sending}
                onClick={requestCode}
              >
                {sending ? 'Sending...' : 'Resend OTP'}
              </button>
              {cooldown > 0 && (
                <>
                  <span className="w-1 h-1 bg-outline-variant rounded-full" />
                  <span className="font-label-md text-on-surface-variant tabular-nums">
                    00:{String(cooldown).padStart(2, '0')}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="w-full max-w-md">
            <button
              type="submit"
              disabled={verifying}
              className="w-full h-14 bg-primary text-on-primary font-title-md rounded-full flex items-center justify-center gap-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg disabled:opacity-60"
            >
              <span>{verifying ? 'Verifying...' : 'Verify & Continue'}</span>
              {!verifying && <Icon name="chevron_right" />}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
