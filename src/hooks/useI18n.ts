
import { useState, useEffect } from 'react';

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

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language;
    return stored || detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentLanguage);
  }, [currentLanguage]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  const changeLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  return {
    currentLanguage,
    changeLanguage,
    t,
  };
};
