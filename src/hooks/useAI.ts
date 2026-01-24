import { useState, useCallback } from 'react';
import { ProviderFactory, WebLLMProvider } from '../providers';
import { CorrectionResult, CorrectionStyle, ExecutionStep } from '../types';
import { Logger } from '../services';
import { useTranslation } from 'react-i18next';

export const useAI = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<ExecutionStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrectionResult | null>(null);

  const runCorrection = useCallback(
    async (
      text: string,
      modelId: string,
      style: CorrectionStyle = CorrectionStyle.STANDARD,
    ): Promise<CorrectionResult> => {
      if (!text.trim()) {
        throw new Error(t('messages.provide_text'));
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
            throw new Error(t('messages.webgpu_not_available'));
          }
          throw new Error(t('messages.model_failed_load'));
        }

        setStep('correcting');
        const correctionResult = await aiProvider.correct(text, style);
        setResult(correctionResult);
        setStep('done');

        return correctionResult;
      } catch (err) {
        if ((err as Error)?.message === 'aborted') {
          setStep('idle');
          return { original: text, corrected: text };
        }

        const errorMessage = (err as Error)?.message || t('messages.correction_failed');
        Logger.error('useAI', 'Correction error', err);
        setError(errorMessage);
        setStep('error');
        throw new Error(errorMessage);
      }
    },
    [t],
  );

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
