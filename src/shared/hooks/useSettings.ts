import { useState, useEffect } from 'react';
import { Settings, CorrectionStyle } from '@/shared/types';
import { DEFAULT_MODEL_ID } from '@/core/constants';
import { Storage, Logger } from '@/core/services';
import i18n from '@/core/i18n';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    selectedModel: DEFAULT_MODEL_ID,
    selectedStyle: CorrectionStyle.STANDARD,
    language: 'en',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await Storage.getSettings();

      // Ensure defaults
      if (!loadedSettings.selectedModel) {
        loadedSettings.selectedModel = DEFAULT_MODEL_ID;
      }
      if (!loadedSettings.selectedStyle) {
        loadedSettings.selectedStyle = CorrectionStyle.STANDARD;
      }

      // Force English
      loadedSettings.language = 'en';

      await Storage.updateSettings(loadedSettings);

      // Apply language to i18n
      if (i18n.language !== 'en') {
        i18n.changeLanguage('en');
      }

      setSettings(loadedSettings);
      Logger.debug('useSettings', 'Settings loaded (English only mode)', loadedSettings);
    } catch (error) {
      Logger.error('useSettings', 'Failed to load settings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    const prevSettings = settings;
    const newSettings = { ...settings, ...updates };

    // Apply language change immediately if present
    if (updates.language && updates.language !== i18n.language) {
      i18n.changeLanguage(updates.language);
    }

    setSettings(newSettings);

    try {
      await Storage.updateSettings(updates);
      Logger.debug('useSettings', 'Settings updated', updates);
    } catch (error) {
      Logger.error('useSettings', 'Failed to save settings', error);
      // Revert local state on failure
      if (prevSettings.language && prevSettings.language !== i18n.language) {
        i18n.changeLanguage(prevSettings.language);
      }
      setSettings(prevSettings);
    }
  };

  return { settings, updateSettings, isLoading };
};
