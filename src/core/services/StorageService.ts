import { STORAGE_KEYS, DEFAULT_MODEL_ID, DEFAULT_LANGUAGE } from '@/core/constants';
import { Settings, CorrectionStyle } from '@/shared/types';
import { Logger } from '@/core/services/Logger';

// Define the shape of our storage
interface StorageSchema {
  grammar_assistant_settings: Settings;
  pendingText: string;
  pendingModelDownload: string;
  pendingError: string;
}

// Type to ensure STORAGE_KEYS values match StorageSchema keys
type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const DEFAULT_SETTINGS: Settings = {
  selectedModel: DEFAULT_MODEL_ID,
  selectedStyle: CorrectionStyle.STANDARD,
  language: DEFAULT_LANGUAGE,
  correctionLanguage: DEFAULT_LANGUAGE,
};

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Get a value from storage
   * @param key The key to retrieve
   * @returns Promise resolving to the value
   */
  public async get<K extends StorageKey>(key: K): Promise<K extends keyof StorageSchema ? StorageSchema[K] : never> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key];
    } catch (error) {
      Logger.error('StorageService', `Failed to get key: ${key}`, error);
      return undefined as unknown as K extends keyof StorageSchema ? StorageSchema[K] : never;
    }
  }

  /**
   * Set a value in storage
   * @param key The key to set
   * @param value The value to store
   */
  public async set<K extends StorageKey>(
    key: K,
    value: K extends keyof StorageSchema ? StorageSchema[K] : never,
  ): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
      Logger.debug('StorageService', `Set key: ${key}`, value);
    } catch (error) {
      const errorMessage = (error as Error)?.message || '';
      if (errorMessage.includes('QUOTA') || errorMessage.includes('quota')) {
        Logger.warn('StorageService', `Storage quota exceeded when setting ${key}. Value not saved.`);
        return;
      }
      Logger.error('StorageService', `Failed to set key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Remove one or more values from storage
   * @param keys The key or keys to remove
   */
  public async remove(keys: StorageKey | StorageKey[]): Promise<void> {
    try {
      await chrome.storage.local.remove(keys);
      Logger.debug('StorageService', `Removed keys: ${Array.isArray(keys) ? keys.join(', ') : keys}`);
    } catch (error) {
      Logger.error('StorageService', `Failed to remove keys: ${keys}`, error);
    }
  }

  /**
   * Subscribe to storage changes for a specific key
   * @param key The key to watch
   * @param callback Function to call when value changes
   * @returns Unsubscribe function
   */
  public subscribe<K extends StorageKey>(
    key: K,
    callback: (newValue: K extends keyof StorageSchema ? StorageSchema[K] : unknown) => void,
  ): () => void {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[key]) {
        callback(changes[key].newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  /**
   * Get settings with defaults applied
   */
  public async getSettings(): Promise<Settings> {
    const settings = await this.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  /**
   * Update settings (partial update supported)
   */
  public async updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const updated = { ...currentSettings, ...newSettings };
    await this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  /**
   * Clear all storage
   */
  public async clear(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      Logger.info('StorageService', 'Storage cleared');
    } catch (error) {
      Logger.error('StorageService', 'Failed to clear storage', error);
    }
  }
}

export const Storage = StorageService.getInstance();
