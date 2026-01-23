import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { DEFAULT_MODEL_ID } from '../constants';
import { CorrectionStyle } from '../types';
import { Storage, Logger } from '../services';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    defaultStyle: CorrectionStyle.FORMAL,
    selectedModel: DEFAULT_MODEL_ID,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await Storage.getSettings();

      // Ensure a model is selected
      if (!loadedSettings.selectedModel) {
        loadedSettings.selectedModel = DEFAULT_MODEL_ID;
        await Storage.updateSettings({ selectedModel: DEFAULT_MODEL_ID });
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
    setSettings(newSettings);

    try {
      await Storage.updateSettings(updates);
      Logger.debug('useSettings', 'Settings updated', updates);
    } catch (error) {
      Logger.error('useSettings', 'Failed to save settings', error);
      // Revert local state on failure
      setSettings(prevSettings);
    }
  };

  return { settings, updateSettings, isLoading };
};
