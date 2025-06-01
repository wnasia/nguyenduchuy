
import { useState, useEffect } from 'react';

export type Language = 'en' | 'vi' | 'zh' | 'ja';

interface Translations {
  [key: string]: any;
}

const translations: Record<Language, Translations> = {
  en: require('../locales/en.json'),
  vi: require('../locales/vi.json'),
  zh: require('../locales/zh.json'),
  ja: require('../locales/ja.json'),
};

const STORAGE_KEY = 'preferred-language';

const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en'; // Default to English
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
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
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
