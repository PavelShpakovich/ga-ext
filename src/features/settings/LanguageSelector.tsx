import React, { useEffect, useState } from 'react';
import { Language } from '@/shared/types';
import { LANGUAGE_CONFIG } from '@/core/constants';
import { Select } from '@/shared/components/ui/Select';
import { changeLanguage } from '@/core/i18n';
import { useSettings } from '@/shared/hooks/useSettings';

export const LanguageSelector: React.FC = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  const [uiLanguage, setUiLanguage] = useState<Language>(Language.EN);
  const [correctionLanguage, setCorrectionLanguage] = useState<Language>(Language.EN);

  useEffect(() => {
    if (!isLoading) {
      setUiLanguage(settings.language);
      setCorrectionLanguage(settings.correctionLanguage);
    }
  }, [settings.language, settings.correctionLanguage, isLoading]);

  const handleUiLanguageChange = async (language: string) => {
    const newLanguage = language as Language;
    setUiLanguage(newLanguage);

    try {
      // Update i18n
      await changeLanguage(newLanguage);

      // Update settings which will be persisted
      await updateSettings({ language: newLanguage });
    } catch (error) {
      console.error('Failed to change UI language:', error);
      // Revert on error
      setUiLanguage(settings.language);
    }
  };

  const handleCorrectionLanguageChange = async (language: string) => {
    const newLanguage = language as Language;
    setCorrectionLanguage(newLanguage);

    try {
      // Update settings which will be persisted
      await updateSettings({ correctionLanguage: newLanguage });
    } catch (error) {
      console.error('Failed to change correction language:', error);
      // Revert on error
      setCorrectionLanguage(settings.correctionLanguage);
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">UI Language</label>
        <Select
          options={languageOptions}
          value={uiLanguage}
          onChange={handleUiLanguageChange}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Text Correction Language</label>
        <Select
          options={languageOptions}
          value={correctionLanguage}
          onChange={handleCorrectionLanguageChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default LanguageSelector;
