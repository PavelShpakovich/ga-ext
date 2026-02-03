// AI Provider Factory

import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { DEFAULT_MODEL_ID } from '@/core/constants';
import { Logger } from '@/core/services/Logger';

export class ProviderFactory {
  // Only keep ONE active provider instance to manage GPU memory usage.
  // Switching models requires unloading the previous one first.
  private static activeInstance: WebLLMProvider | null = null;
  private static activeModelId: string | null = null;
  private static activeTask: Promise<unknown> = Promise.resolve();
  private static activeOperations: number = 0;

  static async createProvider(model?: string): Promise<WebLLMProvider> {
    const targetModelId = model || DEFAULT_MODEL_ID;

    // Use a sequential task queue to prevent race conditions during model switches
    const result = await (this.activeTask = this.activeTask
      .then(async () => {
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
   * Check if there are active operations
   */
  static hasActiveOperations(): boolean {
    return this.activeOperations > 0;
  }

  /**
   * Mark operation start (call before using provider)
   */
  static startOperation(): void {
    this.activeOperations++;
    Logger.debug('ProviderFactory', 'Operation started', { active: this.activeOperations });
  }

  /**
   * Mark operation end (call after provider operation completes)
   */
  static endOperation(): void {
    this.activeOperations = Math.max(0, this.activeOperations - 1);
    Logger.debug('ProviderFactory', 'Operation ended', { active: this.activeOperations });
  }

  /**
   * Clears all cached provider instances.
   * Useful when reloading models or clearing memory.
   * Will not unload if there are active operations in progress.
   */
  static async clearInstances(force: boolean = false): Promise<void> {
    if (!force && this.activeOperations > 0) {
      Logger.warn('ProviderFactory', 'Cannot clear instances - operations in progress', {
        activeOperations: this.activeOperations,
      });
      return;
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
