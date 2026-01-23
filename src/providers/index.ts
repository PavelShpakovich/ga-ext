// AI Provider Factory

import { WebLLMProvider } from './WebLLMProvider';
import { DEFAULT_MODEL_ID } from '../constants';
import { Logger } from '../services/Logger';

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
  static clearInstances(): void {
    this.instances.clear();
    Logger.debug('ProviderFactory', 'Cleared all provider instances');
  }
}

export { AIProvider } from './AIProvider';
export { WebLLMProvider } from './WebLLMProvider';
