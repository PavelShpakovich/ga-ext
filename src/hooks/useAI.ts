// React hook for AI provider

import { useState, useCallback } from 'react';
import { ProviderFactory, WebLLMProvider } from '../providers';
import { CorrectionResult, CorrectionStyle } from '../types';
import { Storage, Logger } from '../services';

declare global {
  interface Window {
    __webllmProvider: unknown;
  }
}

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [provider, setProvider] = useState<unknown>(null);

  const correct = useCallback(async (text: string, style: CorrectionStyle): Promise<CorrectionResult> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get user settings via Storage Service
      const userSettings = await Storage.getSettings();

      Logger.debug('useAI', 'Starting correction', { style, model: userSettings.selectedModel });

      // Create AI provider
      const aiProvider = ProviderFactory.createProvider(userSettings.selectedModel);
      setProvider(aiProvider);

      // Store provider globally BEFORE initialization so stopDownload works during download
      // TODO: Move to a proper singleton service management
      window.__webllmProvider = aiProvider;

      // Check availability (includes WebGPU check and model initialization)
      const isAvailable = await aiProvider.isAvailable();
      if (!isAvailable) {
        const hasWebGPU = await WebLLMProvider.isWebGPUAvailable();
        if (!hasWebGPU) {
          throw new Error('WebGPU is not available. Please use Chrome/Edge with hardware acceleration enabled.');
        }
        throw new Error('Failed to load AI model. Please try again.');
      }

      // Perform correction
      const correctionResult = await aiProvider.correct(text, style);
      setResult(correctionResult);
      Logger.info('useAI', 'Correction successful');

      return correctionResult;
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Correction failed';
      Logger.error('useAI', 'Correction error', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    correct,
    isLoading,
    error,
    result,
    provider,
  };
};
