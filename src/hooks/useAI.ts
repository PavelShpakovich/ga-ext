import { useState, useCallback } from 'react';
import { ProviderFactory, WebLLMProvider } from '../providers';
import { CorrectionResult, CorrectionStyle, ExecutionStep } from '../types';
import { Logger } from '../services';

export const useAI = () => {
  const [step, setStep] = useState<ExecutionStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrectionResult | null>(null);

  const runCorrection = useCallback(async (text: string, modelId: string): Promise<CorrectionResult> => {
    if (!text.trim()) {
      throw new Error('Please provide text to correct.');
    }

    setStep('preparing-model');
    setError(null);
    setResult(null);

    try {
      const aiProvider = ProviderFactory.createProvider(modelId);
      aiProvider.configure({});

      const isAvailable = await aiProvider.isAvailable();
      if (!isAvailable) {
        const hasWebGPU = await WebLLMProvider.isWebGPUAvailable();
        if (!hasWebGPU) {
          throw new Error('WebGPU is not available. Enable hardware acceleration in your browser.');
        }
        throw new Error('Model failed to load. Try downloading again.');
      }

      setStep('correcting');
      const correctionResult = await aiProvider.correct(text, CorrectionStyle.FORMAL);
      setResult(correctionResult);
      setStep('done');

      return correctionResult;
    } catch (err) {
      const errorMessage = (err as Error)?.message || 'Correction failed';
      Logger.error('useAI', 'Correction error', err);
      setError(errorMessage);
      setStep('error');
      throw new Error(errorMessage);
    }
  }, []);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setResult(null);
  }, []);

  return {
    runCorrection,
    step,
    error,
    result,
    reset,
  };
};
