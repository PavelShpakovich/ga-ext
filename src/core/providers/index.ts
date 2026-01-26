// AI Provider Factory

import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { DEFAULT_MODEL_ID } from '@/core/constants';
import { Logger } from '@/core/services/Logger';

export class ProviderFactory {
  private static instances = new Map<string, WebLLMProvider>();

  static createProvider(model?: string): WebLLMProvider {
    // If no model provided, use the constant default
    const modelId = model || DEFAULT_MODEL_ID;

    if (!this.instances.has(modelId)) {
      Logger.debug('ProviderFactory', `Creating new provider instance for model: ${modelId}`);
      this.instances.set(modelId, new WebLLMProvider(modelId));
    } else {
      Logger.debug('ProviderFactory', `Reusing existing provider instance for model: ${modelId}`);
    }

    return this.instances.get(modelId)!;
  }

  /**
   * Clears all cached provider instances.
   * Useful when reloading models or clearing memory.
   */
  static async clearInstances(): Promise<void> {
    const instances = Array.from(this.instances.values());
    this.instances.clear();

    for (const instance of instances) {
      try {
        await instance.stopDownload();
      } catch (err) {
        Logger.error('ProviderFactory', 'Error stopping instance during clear', err);
      }
    }
    Logger.debug('ProviderFactory', 'Cleared and stopped all provider instances');
  }
}

export { AIProvider } from '@/core/providers/AIProvider';
export { WebLLMProvider } from '@/core/providers/WebLLMProvider';
