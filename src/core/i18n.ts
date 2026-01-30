import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from '@/core/locales/en.json';
import ruTranslations from '@/core/locales/ru.json';
import esTranslations from '@/core/locales/es.json';
import deTranslations from '@/core/locales/de.json';
import frTranslations from '@/core/locales/fr.json';
import { Language } from '@/shared/types';

// Preload only essential languages (English + detected language)
// Other languages loaded on-demand
const resources = {
  [Language.EN]: { translation: enTranslations },
  [Language.RU]: { translation: ruTranslations },
  [Language.ES]: { translation: esTranslations },
  [Language.DE]: { translation: deTranslations },
  [Language.FR]: { translation: frTranslations },
};

// Detect user's browser language and map to supported languages
const detectUserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return Language.EN;

  const browserLang = navigator.language?.split('-')[0].toLowerCase() || '';
  const supportedLangs = Object.values(Language);

  // Try exact match
  const exactMatch = supportedLangs.find((lang) => lang === browserLang);
  if (exactMatch) return exactMatch;

  // Map common language codes to our supported languages
  const languageMap: Record<string, Language> = {
    ru: Language.RU,
    es: Language.ES,
    de: Language.DE,
    fr: Language.FR,
    en: Language.EN,
  };

  return languageMap[browserLang] || Language.EN;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: Language.EN,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Override detected language if not in our supported list
const detectedLang = i18n.language as Language;
const supportedLanguages = Object.values(Language);
if (!supportedLanguages.includes(detectedLang)) {
  i18n.changeLanguage(detectUserLanguage());
}

export const changeLanguage = async (language: Language): Promise<void> => {
  await i18n.changeLanguage(language);
};

/**
 * Get memory usage estimate for loaded languages
 * Used for performance monitoring
 */
export const getLoadedLanguages = (): Language[] => {
  return Object.keys(i18n.options.resources || {}) as Language[];
};

export default i18n;
