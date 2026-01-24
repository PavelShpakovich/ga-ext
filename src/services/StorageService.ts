import { STORAGE_KEYS, DEFAULT_MODEL_ID } from '../constants';
import { Settings, CorrectionStyle } from '../types';
import { Logger } from './Logger';

// Define the shape of our storage
interface StorageSchema {
  [STORAGE_KEYS.SETTINGS]: Settings;
  [STORAGE_KEYS.PENDING_TEXT]: string;
  [STORAGE_KEYS.PENDING_MODEL_DOWNLOAD]: string;
  [STORAGE_KEYS.PENDING_AUTO_CORRECT]: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  selectedModel: DEFAULT_MODEL_ID,
  selectedStyle: CorrectionStyle.STANDARD,
  language: 'en',
};

class StorageService {
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
  public async get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K] | undefined> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key];
    } catch (error) {
      Logger.error('StorageService', `Failed to get key: ${key}`, error);
      return undefined;
    }
  }

  /**
   * Set a value in storage
   * @param key The key to set
   * @param value The value to store
   */
  public async set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
      Logger.debug('StorageService', `Set key: ${key}`, value);
    } catch (error) {
      Logger.error('StorageService', `Failed to set key: ${key}`, error);
      throw error;
    }
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
