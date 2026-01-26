// AI Provider Factory

import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { DEFAULT_MODEL_ID } from '@/core/constants';
import { Logger } from '@/core/services/Logger';

export class ProviderFactory {
  // Only keep ONE active provider instance to manage GPU memory usage.
  // Switching models requires unloading the previous one first.
  private static activeInstance: WebLLMProvider | null = null;
  private static activeModelId: string | null = null;

  static createProvider(model?: string): WebLLMProvider {
    // If no model provided, use the constant default
    const targetModelId = model || DEFAULT_MODEL_ID;

    // Check if we already have this model active
    if (this.activeInstance && this.activeModelId === targetModelId) {
      Logger.debug('ProviderFactory', `Reusing active provider for model: ${targetModelId}`);
      return this.activeInstance;
    }

    // If we have a DIFFERENT model active, we MUST unload it first
    if (this.activeInstance) {
      Logger.info('ProviderFactory', `Switching models: Unloading ${this.activeModelId} for ${targetModelId}`);
      // Fire and forget unload? No, better to wait or just trigger it.
      // Since createProvider is synchronous (not async), we can't await unload here easily without changing signature.
      // However, WebLLMProvider.unload() is async.
      // We will trigger the unload ensuring it runs, but we create the new instance immediately.
      // Note: WebLLM (MLCEngine) might throw if two engines try to use GPU.
      // Ideally createProvider should be async, but that requires refactoring useAI.
      // For now, we will orphan the old instance and let it try to clean up.

      const oldInstance = this.activeInstance;
      oldInstance.unload().catch((err) => {
        Logger.error('ProviderFactory', 'Failed to unload previous model gracefully', err);
      });

      this.activeInstance = null;
      this.activeModelId = null;
    }

    Logger.debug('ProviderFactory', `Creating new provider instance for model: ${targetModelId}`);
    const newInstance = new WebLLMProvider(targetModelId);

    this.activeInstance = newInstance;
    this.activeModelId = targetModelId;

    return newInstance;
  }

  /**
   * Clears all cached provider instances.
   * Useful when reloading models or clearing memory.
   */
  static async clearInstances(): Promise<void> {
    if (this.activeInstance) {
      try {
        await this.activeInstance.unload();
      } catch (err) {
        Logger.error('ProviderFactory', 'Error unloading instance during clear', err);
      }
      this.activeInstance = null;
      this.activeModelId = null;
    }
    Logger.debug('ProviderFactory', 'Cleared active provider');
  }
}

export { AIProvider } from '@/core/providers/AIProvider';
export { WebLLMProvider } from '@/core/providers/WebLLMProvider';
