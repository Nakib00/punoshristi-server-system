import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../i18n/LanguageContext';

const ONBOARDING_FLAG = 'punoshristi/onboarded';

const STEPS = [
  { icon: 'delete', titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body' },
  { icon: 'qr_code_scanner', titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body' },
  { icon: 'redeem', titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function finish() {
    localStorage.setItem(ONBOARDING_FLAG, '1');
    navigate('/login', { replace: true });
  }

  return (
    <main className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="absolute top-4 right-4 z-30">
        <LanguageToggle />
      </div>
      <section className="relative w-full h-[55vh] flex items-center justify-center bg-[#F0FAF2]">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary-fixed opacity-20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-secondary-fixed opacity-20 rounded-full blur-2xl" />
        <div className="relative z-10 w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name={current.icon} className="text-primary" size="72px" />
        </div>
      </section>

      <section className="flex-grow w-full bg-white rounded-t-[40px] px-margin-mobile flex flex-col items-center justify-between pb-xl pt-lg -mt-8 relative z-20">
        <div className="flex items-center gap-xs">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={
                i === step
                  ? 'w-8 h-2.5 rounded-full bg-primary'
                  : 'w-2.5 h-2.5 rounded-full bg-surface-container-highest'
              }
            />
          ))}
        </div>

        <div className="text-center space-y-md max-w-xs mx-auto">
          <h1 className="font-headline-xl text-headline-lg-mobile text-primary tracking-tight">{t(current.titleKey)}</h1>
          <p className="font-body-lg text-body-md text-on-surface-variant leading-relaxed px-sm">{t(current.bodyKey)}</p>
        </div>

        <div className="w-full flex flex-col gap-sm pt-lg">
          <button
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            className="group w-full h-[64px] bg-primary text-white font-title-md text-title-md rounded-full flex items-center justify-center gap-sm active:scale-95 transition-all duration-200 shadow-lg shadow-primary/10"
          >
            {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
            <Icon name="arrow_forward" />
          </button>
          {!isLast && (
            <button onClick={finish} className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
              {t('onboarding.skip')}
            </button>
          )}
          {isLast && (
            <div className="flex justify-center items-center gap-xs">
              <span className="font-body-md text-body-md text-on-surface-variant">{t('onboarding.alreadyHaveAccount')}</span>
              <button onClick={finish} className="font-label-md text-label-md text-primary hover:underline font-bold">
                {t('onboarding.login')}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export { ONBOARDING_FLAG };
