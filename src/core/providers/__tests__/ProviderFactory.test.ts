import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderFactory } from '../index';
import { WebLLMProvider } from '../WebLLMProvider';
import { DEFAULT_MODEL_ID } from '../../constants';

// Mock WebLLMProvider
const unloadMock = vi.fn().mockResolvedValue(undefined);
const stopDownloadMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../WebLLMProvider', () => {
  return {
    WebLLMProvider: vi.fn().mockImplementation(function (modelId) {
      return {
        modelId,
        unload: unloadMock,
        stopDownload: stopDownloadMock,
      };
    }),
  };
});

describe('ProviderFactory', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await ProviderFactory.clearInstances();
  });

  it('should create a new provider instance', () => {
    const provider = ProviderFactory.createProvider('model-a');
    expect(provider).toBeDefined();
    expect(WebLLMProvider).toHaveBeenCalledWith('model-a');
  });

  it('should reuse existing instance if model matches', () => {
    const provider1 = ProviderFactory.createProvider('model-a');
    const provider2 = ProviderFactory.createProvider('model-a');

    expect(provider1).toBe(provider2);
    expect(WebLLMProvider).toHaveBeenCalledTimes(1);
  });

  it('should unload previous instance when switching models', () => {
    const provider1 = ProviderFactory.createProvider('model-a');
    // Simulate switching
    const provider2 = ProviderFactory.createProvider('model-b');

    // old provider should be unloaded
    expect(provider1.unload).toHaveBeenCalled();
    // New provider created
    expect(WebLLMProvider).toHaveBeenCalledTimes(2); // once for model-a, once for model-b
    expect(provider2).not.toBe(provider1);
  });

  it('should use default model ID if none provided', () => {
    ProviderFactory.createProvider();
    expect(WebLLMProvider).toHaveBeenCalledWith(DEFAULT_MODEL_ID);
  });

  it('should clear instances correctly', async () => {
    const provider = ProviderFactory.createProvider('model-a');
    await ProviderFactory.clearInstances();

    expect(provider.unload).toHaveBeenCalled();

    // Creating again should be fresh
    ProviderFactory.createProvider('model-a');
    // Should be a 2nd call now (1st in setup, 2nd here after clear)
    expect(WebLLMProvider).toHaveBeenCalledTimes(2);
  });
});
