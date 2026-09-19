import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';

const PAGES = {
  settings: { icon: 'settings', titleKey: 'info.settingsTitle', bodyKey: 'info.settingsBody' },
  privacy: { icon: 'privacy_tip', titleKey: 'info.privacyTitle', bodyKey: 'info.privacyBody' },
  help: { icon: 'help', titleKey: 'info.helpTitle', bodyKey: 'info.helpBody' },
  contact: { icon: 'contact_support', titleKey: 'info.contactTitle', bodyKey: 'info.contactBody' },
  rate: { icon: 'star', titleKey: 'info.rateTitle', bodyKey: 'info.rateBody' },
};

export default function InfoPage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const page = PAGES[topic] || { icon: 'info', titleKey: 'info.defaultTitle', bodyKey: 'info.defaultBody' };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <header className="bg-surface sticky top-0 z-50 flex items-center gap-md px-margin-mobile h-16 w-full">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">{t(page.titleKey)}</h1>
      </header>
      <main className="px-margin-mobile pt-xl flex flex-col items-center text-center gap-md">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
          <Icon name={page.icon} className="text-on-secondary-container" size="32px" />
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">{t(page.bodyKey)}</p>
      </main>
    </div>
  );
}
