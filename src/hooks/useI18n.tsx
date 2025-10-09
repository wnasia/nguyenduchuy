import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

// Import JSON files using ES6 imports
import enTranslations from '../locales/en.json';
import viTranslations from '../locales/vi.json';
import zhTranslations from '../locales/zh.json';
import jaTranslations from '../locales/ja.json';

export type Language = 'en' | 'vi' | 'zh' | 'ja';

interface Translations {
  [key: string]: any;
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  vi: viTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
};

const STORAGE_KEY = 'preferred-language';

const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'vi'; // Default to Vietnamese
};

interface I18nContextValue {
  currentLanguage: Language;
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored || detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentLanguage);
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    for (const k of keys) value = value?.[k];
    return typeof value === 'string' ? value : key;
  }, [currentLanguage]);

  const changeLanguage = useCallback((language: Language) => {
    setCurrentLanguage(language);
  }, []);

  const value = useMemo(() => ({ currentLanguage, changeLanguage, t }), [currentLanguage, changeLanguage, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback to a non-reactive translator using stored language to avoid crashes
    const stored = (localStorage.getItem(STORAGE_KEY) as Language | null) || detectBrowserLanguage();
    const t = (key: string) => {
      const keys = key.split('.');
      let value: any = translations[stored];
      for (const k of keys) value = value?.[k];
      return typeof value === 'string' ? value : key;
    };
    return {
      currentLanguage: stored,
      changeLanguage: () => {},
      t,
    } as I18nContextValue;
  }
  return ctx;
};
