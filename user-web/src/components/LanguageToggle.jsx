import { useLanguage } from '../i18n/LanguageContext';

// A small persistent EN / বাং switch. `dark` renders it for use on dark
// backgrounds (e.g. the scan screen, the success screen).
export default function LanguageToggle({ dark = false, className = '' }) {
  const { lang, setLang } = useLanguage();

  const base = 'flex items-center rounded-full p-0.5 text-[11px] font-bold shrink-0';
  const shell = dark ? `${base} bg-white/15` : `${base} bg-surface-container-high`;

  function optionClass(value) {
    const active = lang === value;
    if (dark) {
      return `px-2 py-1 rounded-full transition-colors ${active ? 'bg-white text-on-background' : 'text-white/70'}`;
    }
    return `px-2 py-1 rounded-full transition-colors ${active ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`;
  }

  return (
    <div className={`${shell} ${className}`} role="group" aria-label="Language">
      <button type="button" className={optionClass('en')} onClick={() => setLang('en')}>
        EN
      </button>
      <button type="button" className={optionClass('bn')} onClick={() => setLang('bn')}>
        বাং
      </button>
    </div>
  );
}
