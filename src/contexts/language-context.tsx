
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Locale = 'en' | 'es';

const translations = { en, es };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && ['en', 'es'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  const t = useCallback((key: string): string => {
      const keys = key.split('.');
      let result: any = translations[locale];
      for (const k of keys) {
          result = result?.[k];
          if (result === undefined) {
              // Fallback to English if translation is missing
              let fallbackResult: any = translations.en;
              for (const fk of keys) {
                  fallbackResult = fallbackResult?.[fk];
                  if (fallbackResult === undefined) return key; // Return key if not found in fallback either
              }
              return fallbackResult;
          }
      }
      return result || key;
  }, [locale]);
  

  if (!isMounted) {
    return null; 
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
