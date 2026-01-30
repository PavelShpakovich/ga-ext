import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '@/shared/types';
import { LANGUAGE_CONFIG } from '@/core/constants';
import { Select } from '@/shared/components/ui/Select';
import { changeLanguage } from '@/core/i18n';
import { useSettings } from '@/shared/hooks/useSettings';

export const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, isLoading } = useSettings();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.EN);

  useEffect(() => {
    if (!isLoading) {
      setSelectedLanguage(settings.language);
    }
  }, [settings.language, isLoading]);

  const handleLanguageChange = async (language: string) => {
    const newLanguage = language as Language;
    setSelectedLanguage(newLanguage);

    try {
      // Update i18n
      await changeLanguage(newLanguage);

      // Update settings which will be persisted
      await updateSettings({ language: newLanguage });
    } catch (error) {
      console.error('Failed to change language:', error);
      // Revert on error
      setSelectedLanguage(settings.language);
    }
  };

  if (isLoading) {
    return null;
  }

  const languageOptions = Object.values(Language).map((lang) => ({
    value: lang,
    label: LANGUAGE_CONFIG[lang].name,
  }));

  return (
    <Select
      options={languageOptions}
      value={selectedLanguage}
      onChange={handleLanguageChange}
      className="w-full"
    />
  );
};

export default LanguageSelector;
