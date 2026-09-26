'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, getTranslation, translations } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.hi;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'hi',
  setLocale: () => {},
  t: translations.hi,
  isHindi: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('hi');

  useEffect(() => {
    const saved = localStorage.getItem('app_locale') as Locale;
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === 'en' || newLocale === 'hi') {
      setLocaleState(newLocale);
      localStorage.setItem('app_locale', newLocale);
    }
  };

  const t = getTranslation(locale);
  const isHindi = locale === 'hi';

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isHindi }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
