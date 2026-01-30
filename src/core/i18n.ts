import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '@/core/locales/en.json';
import ruTranslations from '@/core/locales/ru.json';
import esTranslations from '@/core/locales/es.json';
import deTranslations from '@/core/locales/de.json';
import frTranslations from '@/core/locales/fr.json';
import jaTranslations from '@/core/locales/ja.json';
import { Language } from '@/shared/types';

const resources = {
  [Language.EN]: { translation: enTranslations },
  [Language.RU]: { translation: ruTranslations },
  [Language.ES]: { translation: esTranslations },
  [Language.DE]: { translation: deTranslations },
  [Language.FR]: { translation: frTranslations },
  [Language.JA]: { translation: jaTranslations },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: Language.EN,
  lng: Language.EN,
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = async (language: Language): Promise<void> => {
  await i18n.changeLanguage(language);
};

export default i18n;
