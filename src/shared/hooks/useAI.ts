import { useState, useCallback } from 'react';
import { ProviderFactory } from '@/core/providers';
import { CorrectionResult, CorrectionStyle, ExecutionStep, Language } from '@/shared/types';
import { Logger } from '@/core/services';
import { useTranslation } from 'react-i18next';
import { isWebGPUAvailable } from '@/shared/utils/helpers';
import { validateTextInput, validateModelId, ValidationErrorType } from '@/shared/utils/validation';
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
      // Comprehensive input validation
      const textValidation = validateTextInput(text);
      if (!textValidation.valid) {
        const errorMessages: Record<ValidationErrorType, string> = {
          [ValidationErrorType.EMPTY_INPUT]: t('messages.provide_text'),
          [ValidationErrorType.TOO_LONG]: t('errors.content_too_long'),
          [ValidationErrorType.INVALID_ENCODING]: t('messages.invalid_text_encoding'),
          [ValidationErrorType.INVALID_CHARACTERS]: t('messages.invalid_characters'),
          [ValidationErrorType.MALICIOUS_CONTENT]: t('messages.invalid_content'),
        };

        const errorMessage = textValidation.error
          ? errorMessages[textValidation.error] || textValidation.details || t('messages.invalid_input')
          : t('messages.invalid_input');

        Logger.warn('useAI', 'Input validation failed', {
          error: textValidation.error,
          details: textValidation.details,
        });
        throw new Error(errorMessage);
      }

      const modelValidation = validateModelId(modelId);
      if (!modelValidation.valid) {
        Logger.error('useAI', 'Invalid model ID', {
          modelId,
          error: modelValidation.error,
          details: modelValidation.details,
        });
        throw new Error(t('messages.invalid_model_id'));
      }

      // Use sanitized inputs
      const sanitizedText = textValidation.sanitized!;
      const sanitizedModelId = modelValidation.sanitized!;

      setStep(ExecutionStep.PREPARING_MODEL);
      setError(null);
      setResult(null);
      setPartialResult(null);

      Logger.info('useAI', 'Starting correction', {
        modelId: sanitizedModelId,
        textLength: sanitizedText.length,
        style,
        language: langOverride || settings.correctionLanguage,
      });

      try {
        const aiProvider = await ProviderFactory.createProvider(sanitizedModelId);
        aiProvider.configure({});

        const isAvailable = await aiProvider.isAvailable();
        if (!isAvailable) {
          const hasWebGPU = await isWebGPUAvailable();
          if (!hasWebGPU) {
            Logger.error('useAI', 'WebGPU not available');
            throw new Error(t('messages.webgpu_not_available'));
          }
          Logger.error('useAI', 'Model failed to load', { modelId: sanitizedModelId });
          throw new Error(t('messages.model_failed_load'));
        }

        const language = langOverride || settings.correctionLanguage;

        setStep(ExecutionStep.CORRECTING);
        const correctionResult = await aiProvider.correct(sanitizedText, style, language, (partial) => {
          setPartialResult(partial);
        });

        setResult(correctionResult);
        setStep(ExecutionStep.DONE);

        Logger.info('useAI', 'Correction completed successfully', {
          modelId: sanitizedModelId,
          originalLength: sanitizedText.length,
          correctedLength: correctionResult.corrected.length,
        });

        return correctionResult;
      } catch (err) {
        if ((err as Error)?.message === 'aborted') {
          Logger.info('useAI', 'Correction aborted by user');
          setStep(ExecutionStep.IDLE);
          return { original: sanitizedText, corrected: sanitizedText };
        }

        const errorMessage = (err as Error)?.message || t('messages.correction_failed');
        Logger.error('useAI', 'Correction failed', {
          error: err,
          modelId: sanitizedModelId,
          textLength: sanitizedText.length,
        });
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
