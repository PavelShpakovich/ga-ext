// AI Provider Factory

import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { DEFAULT_MODEL_ID, MODEL_IDLE_TIMEOUT_MS } from '@/core/constants';
import { Logger } from '@/core/services/Logger';

export class ProviderFactory {
  // Only keep ONE active provider instance to manage GPU memory usage.
  // Switching models requires unloading the previous one first.
  private static activeInstance: WebLLMProvider | null = null;
  private static activeModelId: string | null = null;
  private static idleTimer: ReturnType<typeof setTimeout> | null = null;
  private static activeTask: Promise<unknown> = Promise.resolve();

  private static resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(async () => {
      Logger.info('ProviderFactory', 'Idle timeout reached, unloading model to save memory');
      await this.clearInstances();
    }, MODEL_IDLE_TIMEOUT_MS);
  }

  static async createProvider(model?: string): Promise<WebLLMProvider> {
    const targetModelId = model || DEFAULT_MODEL_ID;

    // Use a sequential task queue to prevent race conditions during model switches
    const result = await (this.activeTask = this.activeTask
      .then(async () => {
        // Reset idle timer on any request for a provider
        this.resetIdleTimer();

        // Check if we already have this model active
        if (this.activeInstance && this.activeModelId === targetModelId) {
          Logger.debug('ProviderFactory', `Reusing active provider for model: ${targetModelId}`);
          return this.activeInstance;
        }

        // Unload existing instance before creating a new one to free VRAM
        await this.clearInstances();

        Logger.debug('ProviderFactory', `Creating new provider instance for model: ${targetModelId}`);
        const newInstance = new WebLLMProvider(targetModelId);

        this.activeInstance = newInstance;
        this.activeModelId = targetModelId;

        return newInstance;
      })
      .catch((err) => {
        Logger.error('ProviderFactory', 'Failed to create provider in queue', err);
        throw err;
      }));

    return result as WebLLMProvider;
  }

  /**
   * Clears all cached provider instances.
   * Useful when reloading models or clearing memory.
   */
  static async clearInstances(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.activeInstance) {
      const instance = this.activeInstance;
      this.activeInstance = null;
      this.activeModelId = null;

      try {
        await instance.unload();
      } catch (err) {
        Logger.error('ProviderFactory', 'Error unloading instance during clear', err);
      }
    }
    Logger.debug('ProviderFactory', 'Cleared active provider');
  }
}

export { AIProvider } from '@/core/providers/AIProvider';
export { WebLLMProvider } from '@/core/providers/WebLLMProvider';
