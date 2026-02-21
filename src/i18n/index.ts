import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import difficultyTranslations from './difficultyTranslations';

export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN';

const resources = {
  ko: { translation: { ...ko, ...difficultyTranslations.ko } },
  en: { translation: { ...en, ...difficultyTranslations.en } },
  ja: { translation: { ...ja, ...difficultyTranslations.ja } },
  'zh-CN': { translation: { ...zhCN, ...difficultyTranslations['zh-CN'] } },
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['ko', 'en', 'ja', 'zh-CN'];

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  if (!language) return 'en';
  if (language.startsWith('zh')) return 'zh-CN';
  if (language.startsWith('ja')) return 'ja';
  if (language.startsWith('en')) return 'en';
  if (language.startsWith('ko')) return 'ko';
  return 'en';
}

export function getLanguageFromPath(pathname?: string): SupportedLanguage | null {
  if (!pathname) return null;
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return null;
  if (SUPPORTED_LANGUAGES.includes(segment as SupportedLanguage)) {
    return segment as SupportedLanguage;
  }
  return null;
}

export function getLanguagePath(language: SupportedLanguage): string {
  return `/${language}`;
}

export function getInitialLanguageFromPath(pathname?: string): SupportedLanguage {
  return getLanguageFromPath(pathname) ?? 'en';
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: getInitialLanguageFromPath(typeof window !== 'undefined' ? window.location.pathname : undefined),
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'oms.language',
    },
  });

export default i18n;
