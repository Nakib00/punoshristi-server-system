import logo from '../assets/logo.png';
import { useLanguage } from '../i18n/LanguageContext';

export default function SplashPage() {
  const { t } = useLanguage();
  return (
    <div className="bg-primary-container font-body-md text-on-primary-container min-h-screen flex flex-col overflow-hidden">
      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile relative">
        <div className="flex flex-col items-center gap-lg text-center">
          <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center p-md backdrop-blur-sm shadow-xl">
            <img alt="Punoshristi Logo" className="w-40 h-40 object-contain drop-shadow-2xl rounded-full" src={logo} />
          </div>
          <div className="flex flex-col gap-xs mt-md">
            <p className="font-headline-xl text-headline-xl text-white tracking-tight">{t('common.appName')}</p>
            <p className="font-title-md text-title-md text-primary-fixed/90 italic tracking-wide">{t('splash.tagline')}</p>
          </div>
        </div>
      </main>
      <footer className="w-full pb-xl px-margin-mobile flex flex-col items-center gap-md">
        <div className="w-full max-w-xs bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div className="bg-secondary-container h-full rounded-full animate-loading" />
        </div>
        <p className="font-label-md text-label-md text-white/60 tracking-wider">{t('splash.poweredBy')}</p>
      </footer>
      <div className="fixed top-[-10%] right-[-10%] w-[300px] h-[300px] bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[250px] h-[250px] bg-primary-fixed/10 rounded-full blur-[80px] pointer-events-none" />
    </div>
  );
}
