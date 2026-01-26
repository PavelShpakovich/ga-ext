import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../StorageService';
import { STORAGE_KEYS } from '../../constants';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Access the singleton
    storageService = StorageService.getInstance();

    // Mock chrome.storage.local.get to return empty object by default
    (chrome.storage.local.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (chrome.storage.local.set as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('should be a singleton', () => {
    const instance1 = StorageService.getInstance();
    const instance2 = StorageService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should get values from local storage', async () => {
    const mockSettings = { selectedModel: 'test-model' };
    (chrome.storage.local.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      [STORAGE_KEYS.SETTINGS]: mockSettings,
    });

    const result = await storageService.get(STORAGE_KEYS.SETTINGS);
    expect(chrome.storage.local.get).toHaveBeenCalledWith(STORAGE_KEYS.SETTINGS);
    expect(result).toEqual(mockSettings);
  });

  it('should set values in local storage', async () => {
    const mockValue = 'some text';
    await storageService.set(STORAGE_KEYS.PENDING_TEXT, mockValue);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [STORAGE_KEYS.PENDING_TEXT]: mockValue,
    });
  });

  it('should handle get errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock logger if needed, but here we just simulate the storage failure
    (chrome.storage.local.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Storage failure'));

    const result = await storageService.get(STORAGE_KEYS.SETTINGS);

    expect(result).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('should handle QUOTA_BYTES error gracefully', async () => {
    // Setup
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (chrome.storage.local.set as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('QUOTA_BYTES quota exceeded'),
    );

    // Act & Assert
    // We expect it NOT to throw, but to log error and maybe return/noop
    await expect(storageService.set(STORAGE_KEYS.PENDING_TEXT, 'huge text')).resolves.not.toThrow();

    // Check that Logger.error was called (we mocked console.error indirectly via Logger)
    // In our implementation Logger calls console.error usually.
    // Let's verify it didn't crash.

    consoleSpy.mockRestore();
  });
});
