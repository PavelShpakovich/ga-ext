import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '@/core/locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
