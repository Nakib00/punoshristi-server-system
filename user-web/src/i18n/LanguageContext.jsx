import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { resolveKey } from './translations';

const LANG_KEY = 'punoshristi/lang';
const LanguageContext = createContext(null);

function interpolate(str, vars) {
  if (!vars) return str;
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), str);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'en');

  const changeLang = useCallback((next) => {
    setLang(next);
    localStorage.setItem(LANG_KEY, next);
  }, []);

  const toggleLang = useCallback(() => {
    changeLang(lang === 'en' ? 'bn' : 'en');
  }, [lang, changeLang]);

  const t = useCallback(
    (key, vars) => {
      const entry = resolveKey(key);
      if (!entry) return key;
      const str = entry[lang] ?? entry.en ?? key;
      return interpolate(str, vars);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang: changeLang, toggleLang, t }), [lang, changeLang, toggleLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
