// i18n 설정 파일
// 사용하기 전에 다음 패키지를 설치해야 합니다:
// yarn add react-i18next i18next i18next-browser-languagedetector

// 패키지 설치 후 아래 주석을 해제하세요
/*
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
  'zh-CN': { translation: zhCN },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en', 'ja', 'zh-CN'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'oms.language',
    },
  });

export default i18n;
*/

// 임시 더미 export (패키지 설치 전)
export default {};