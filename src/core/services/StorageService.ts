import { STORAGE_KEYS, DEFAULT_MODEL_ID } from '@/core/constants';
import { Settings, CorrectionStyle } from '@/shared/types';
import { Logger } from '@/core/services/Logger';

// Define the shape of our storage
interface StorageSchema {
  grammar_assistant_settings: Settings;
  pendingText: string;
  pendingModelDownload: string;
  pendingAutoCorrect: boolean;
  pendingError: string;
}

// Type to ensure STORAGE_KEYS values match StorageSchema keys
type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const DEFAULT_SETTINGS: Settings = {
  selectedModel: DEFAULT_MODEL_ID,
  selectedStyle: CorrectionStyle.STANDARD,
  language: 'en',
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
      return undefined as any;
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
        // Swallow error to prevent app crash, but data is lost.
        // potentially could try to clear other keys here.
        return;
      }
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
