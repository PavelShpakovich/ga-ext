import { useState, useEffect } from 'react';
import { Settings, CorrectionStyle } from '../types';
import { DEFAULT_MODEL_ID } from '../constants';
import { Storage, Logger } from '../services';
import i18n from '../i18n';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    selectedModel: DEFAULT_MODEL_ID,
    selectedStyle: CorrectionStyle.STANDARD,
    language: (i18n.language?.startsWith('ru') ? 'ru' : 'en') as 'en' | 'ru',
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
      if (!loadedSettings.language) {
        loadedSettings.language = (i18n.language?.startsWith('ru') ? 'ru' : 'en') as 'en' | 'ru';
      }

      await Storage.updateSettings(loadedSettings);

      // Apply language to i18n
      if (loadedSettings.language && i18n.language !== loadedSettings.language) {
        i18n.changeLanguage(loadedSettings.language);
      }

      setSettings(loadedSettings);
      Logger.debug('useSettings', 'Settings loaded', loadedSettings);
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
