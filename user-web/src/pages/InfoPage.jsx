import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

const PAGES = {
  settings: { icon: 'settings', title: 'Settings', body: 'Account and notification settings are coming soon.' },
  privacy: { icon: 'privacy_tip', title: 'Privacy', body: 'Our privacy policy will be published here.' },
  help: { icon: 'help', title: 'Help', body: 'A help center / FAQ is coming soon.' },
  contact: { icon: 'contact_support', title: 'Contact', body: 'Reach the Punoshristi team at hello@punoshristi.com.' },
  rate: { icon: 'star', title: 'Rate Punoshristi', body: 'App store ratings will be enabled once Punoshristi ships to app stores.' },
};

export default function InfoPage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const page = PAGES[topic] || { icon: 'info', title: 'Info', body: 'Coming soon.' };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <header className="bg-surface sticky top-0 z-50 flex items-center gap-md px-margin-mobile h-16 w-full">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">{page.title}</h1>
      </header>
      <main className="px-margin-mobile pt-xl flex flex-col items-center text-center gap-md">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
          <Icon name={page.icon} className="text-on-secondary-container" size="32px" />
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">{page.body}</p>
      </main>
    </div>
  );
}
