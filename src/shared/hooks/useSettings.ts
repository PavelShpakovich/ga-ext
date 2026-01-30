import { useState, useEffect } from 'react';
import { Settings, CorrectionStyle } from '@/shared/types';
import { DEFAULT_MODEL_ID, DEFAULT_LANGUAGE, SUPPORTED_MODELS, STORAGE_KEYS } from '@/core/constants';
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
    correctionLanguage: DEFAULT_LANGUAGE,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();

    // Subscribe to storage changes to keep state in sync across hook instances
    const unsubscribe = Storage.subscribe(STORAGE_KEYS.SETTINGS, (newSettings) => {
      if (newSettings) {
        setSettings(newSettings);
        // Apply language to i18n if it changed from storage
        if (newSettings.language && i18n.language !== newSettings.language) {
          i18n.changeLanguage(newSettings.language);
        }
      }
    });

    return () => {
      unsubscribe();
    };
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

      if (!loadedSettings.language) {
        loadedSettings.language = DEFAULT_LANGUAGE;
      }

      if (!loadedSettings.correctionLanguage) {
        loadedSettings.correctionLanguage = loadedSettings.language || DEFAULT_LANGUAGE;
      }

      // Only write back to storage if changes were made during validation/migration
      const originalSettings = await Storage.get(STORAGE_KEYS.SETTINGS);
      const hasChanged = JSON.stringify(originalSettings) !== JSON.stringify(loadedSettings);

      if (hasChanged) {
        await Storage.updateSettings(loadedSettings);
      }

      // Apply language to i18n
      if (i18n.language !== loadedSettings.language) {
        await i18n.changeLanguage(loadedSettings.language);
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

    // Apply language change immediately to i18n if present
    if (updates.language && updates.language !== i18n.language) {
      await i18n.changeLanguage(updates.language);
    }

    setSettings(newSettings);

    try {
      await Storage.updateSettings(updates);
      Logger.debug('useSettings', 'Settings updated', updates);
    } catch (error) {
      Logger.error('useSettings', 'Failed to save settings', error);
      // Revert local state and i18n on failure
      if (prevSettings.language && updates.language && prevSettings.language !== i18n.language) {
        await i18n.changeLanguage(prevSettings.language);
      }
      setSettings(prevSettings);
    }
  };

  return { settings, updateSettings, isLoading };
};
