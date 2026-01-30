import { useState, useCallback } from 'react';
import { ProviderFactory } from '@/core/providers';
import { CorrectionResult, CorrectionStyle, ExecutionStep, Language } from '@/shared/types';
import { Logger } from '@/core/services';
import { useTranslation } from 'react-i18next';
import { isWebGPUAvailable } from '@/shared/utils/helpers';
import { useSettings } from './useSettings';

export const useAI = (): {
  runCorrection: (
    text: string,
    modelId: string,
    style?: CorrectionStyle,
    langOverride?: Language,
  ) => Promise<CorrectionResult>;
  step: ExecutionStep;
  error: string | null;
  result: CorrectionResult | null;
  partialResult: string | null;
  reset: () => void;
} => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [step, setStep] = useState<ExecutionStep>(ExecutionStep.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [partialResult, setPartialResult] = useState<string | null>(null);

  const runCorrection = useCallback(
    async (
      text: string,
      modelId: string,
      style: CorrectionStyle = CorrectionStyle.STANDARD,
      langOverride?: Language,
    ): Promise<CorrectionResult> => {
      if (!text.trim()) {
        throw new Error(t('messages.provide_text'));
      }

      setStep(ExecutionStep.PREPARING_MODEL);
      setError(null);
      setResult(null);
      setPartialResult(null);

      try {
        const aiProvider = await ProviderFactory.createProvider(modelId);
        aiProvider.configure({});

        const isAvailable = await aiProvider.isAvailable();
        if (!isAvailable) {
          const hasWebGPU = await isWebGPUAvailable();
          if (!hasWebGPU) {
            throw new Error(t('messages.webgpu_not_available'));
          }
          throw new Error(t('messages.model_failed_load'));
        }

        const language = langOverride || settings.correctionLanguage;

        setStep(ExecutionStep.CORRECTING);
        const correctionResult = await aiProvider.correct(text, style, language, (partial) => {
          setPartialResult(partial);
        });
        setResult(correctionResult);
        setStep(ExecutionStep.DONE);

        return correctionResult;
      } catch (err) {
        if ((err as Error)?.message === 'aborted') {
          setStep(ExecutionStep.IDLE);
          return { original: text, corrected: text };
        }

        const errorMessage = (err as Error)?.message || t('messages.correction_failed');
        Logger.error('useAI', 'Correction error', err);
        setError(errorMessage);
        setStep(ExecutionStep.ERROR);
        throw new Error(errorMessage);
      }
    },
    [t, settings.correctionLanguage],
  );

  const reset = useCallback(() => {
    setStep(ExecutionStep.IDLE);
    setError(null);
    setResult(null);
    setPartialResult(null);
  }, []);

  return {
    runCorrection,
    step,
    error,
    result,
    partialResult,
    reset,
  };
};
