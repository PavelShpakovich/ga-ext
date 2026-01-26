import { useState, useEffect } from 'react';
import { Settings, CorrectionStyle } from '@/shared/types';
import { DEFAULT_MODEL_ID, DEFAULT_LANGUAGE, SUPPORTED_MODELS } from '@/core/constants';
import { Storage, Logger } from '@/core/services';
import i18n from '@/core/i18n';

export const useSettings = (): {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
} => {
  const [settings, setSettings] = useState<Settings>({
    selectedModel: DEFAULT_MODEL_ID,
    selectedStyle: CorrectionStyle.STANDARD,
    language: DEFAULT_LANGUAGE,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await Storage.getSettings();

      // Ensure defaults and validate/migrate model ID
      if (!loadedSettings.selectedModel) {
        loadedSettings.selectedModel = DEFAULT_MODEL_ID;
      } else {
        // Migration/Validation for model IDs (e.g. casing issues)
        const currentId = loadedSettings.selectedModel;
        const exists = SUPPORTED_MODELS.find((m) => m.id === currentId);

        if (!exists) {
          // Check if it's a casing issue (common with Gemma)
          const matchedByCase = SUPPORTED_MODELS.find((m) => m.id.toLowerCase() === currentId.toLowerCase());
          if (matchedByCase) {
            Logger.info('useSettings', `Migrating model ID from ${currentId} to ${matchedByCase.id}`);
            loadedSettings.selectedModel = matchedByCase.id;
          } else {
            // Not found at all, reset to default
            Logger.warn('useSettings', `Selected model ${currentId} not supported, resetting to default`);
            loadedSettings.selectedModel = DEFAULT_MODEL_ID;
          }
        }
      }

      if (!loadedSettings.selectedStyle) {
        loadedSettings.selectedStyle = CorrectionStyle.STANDARD;
      }

      // Force English
      loadedSettings.language = DEFAULT_LANGUAGE;

      await Storage.updateSettings(loadedSettings);

      // Apply language to i18n
      if (i18n.language !== DEFAULT_LANGUAGE) {
        i18n.changeLanguage(DEFAULT_LANGUAGE);
      }

      setSettings(loadedSettings);
      Logger.debug('useSettings', 'Settings loaded and validated', loadedSettings);
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
