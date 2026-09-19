import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { describeAuthError } from '../api';
import logo from '../assets/logo.png';
import Icon from '../components/Icon';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../i18n/LanguageContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      setError(t('register.errRequired'));
      return;
    }
    if (!/^\d{11}$/.test(phone.trim())) {
      setError(t('register.errPhoneFormat'));
      return;
    }
    if (password.length < 6) {
      setError(t('register.errPasswordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.errPasswordMismatch'));
      return;
    }
    if (!agreed) {
      setError(t('register.errAgreeTerms'));
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, phone.trim());
      navigate('/verify-otp', { replace: true });
    } catch (err) {
      setError(describeAuthError(err, t('register.errGeneric')));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-grow flex flex-col items-center justify-start px-margin-mobile py-xl max-w-lg mx-auto w-full min-h-screen">
      <div className="fixed top-4 right-4 z-30">
        <LanguageToggle />
      </div>
      <div className="mb-lg flex flex-col items-center">
        <img alt="Punoshristi Logo" className="h-16 w-16 object-contain rounded-full mb-md" src={logo} />
        <h1 className="font-headline-xl text-headline-xl text-primary text-center">{t('register.title')}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant text-center mt-xs">{t('register.subtitle')}</p>
      </div>

      <form className="w-full space-y-md" onSubmit={handleSubmit}>
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface-variant ml-xs">{t('register.fullName')}</label>
          <div className="relative">
            <Icon name="person" className="absolute left-md top-1/2 -translate-y-1/2 text-primary" />
            <input
              className="w-full bg-surface-container-low border-[1.5px] border-outline-variant focus:border-secondary rounded-xl py-3 pl-12 pr-md outline-none transition-all placeholder:text-on-surface-variant/50"
              placeholder={t('register.fullNamePlaceholder')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface-variant ml-xs">{t('register.phoneNumber')}</label>
          <div className="flex gap-xs">
            <div className="flex items-center bg-surface-container-low border-[1.5px] border-outline-variant rounded-xl py-3 px-md space-x-xs shrink-0 w-20 justify-center">
              <span className="font-body-md text-on-surface">+88</span>
            </div>
            <div className="relative flex-grow">
              <Icon name="phone" className="absolute left-md top-1/2 -translate-y-1/2 text-primary" />
              <input
                className="w-full bg-surface-container-low border-[1.5px] border-outline-variant focus:border-secondary rounded-xl py-3 pl-12 pr-md outline-none transition-all placeholder:text-on-surface-variant/50"
                placeholder="01XXX-XXXXXX"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                autoComplete="tel"
                inputMode="numeric"
                maxLength={11}
              />
            </div>
          </div>
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface-variant ml-xs">{t('register.email')}</label>
          <div className="relative">
            <Icon name="mail" className="absolute left-md top-1/2 -translate-y-1/2 text-primary" />
            <input
              className="w-full bg-surface-container-low border-[1.5px] border-outline-variant focus:border-secondary rounded-xl py-3 pl-12 pr-md outline-none transition-all placeholder:text-on-surface-variant/50"
              placeholder="email@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant ml-xs">{t('register.password')}</label>
            <div className="relative">
              <Icon name="lock" className="absolute left-md top-1/2 -translate-y-1/2 text-primary" />
              <input
                className="w-full bg-surface-container-low border-[1.5px] border-outline-variant focus:border-secondary rounded-xl py-3 pl-12 pr-md outline-none transition-all placeholder:text-on-surface-variant/50"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant ml-xs">{t('register.confirmPassword')}</label>
            <div className="relative">
              <Icon name="verified_user" className="absolute left-md top-1/2 -translate-y-1/2 text-primary" />
              <input
                className="w-full bg-surface-container-low border-[1.5px] border-outline-variant focus:border-secondary rounded-xl py-3 pl-12 pr-md outline-none transition-all placeholder:text-on-surface-variant/50"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-md py-xs">
          <input
            className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-secondary cursor-pointer"
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label className="font-body-md text-body-md text-on-surface-variant leading-tight" htmlFor="terms">
            {t('register.agreePrefix')} <span className="text-primary font-label-md">{t('register.termsOfService')}</span>{' '}
            {t('register.and')} <span className="text-primary font-label-md">{t('register.privacyPolicy')}</span>
            {t('register.agreeSuffix')}
          </label>
        </div>

        {error && <p className="text-error font-body-md text-body-md">{error}</p>}

        <button
          className="w-full bg-primary text-on-primary font-title-md py-4 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 mt-md disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? t('register.creating') : t('register.createAccount')}
        </button>
      </form>

      <p className="mt-xl font-body-lg text-body-lg text-on-surface-variant">
        {t('register.haveAccount')}{' '}
        <Link className="text-primary font-bold hover:underline ml-xs" to="/login">
          {t('register.loginHere')}
        </Link>
      </p>
    </main>
  );
}
