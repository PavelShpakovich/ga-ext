import { useCallback, useRef, useMemo } from 'react';
import { WebLLMProvider } from '@/core/providers';
import { generateCacheKey, detectDominantLanguage } from '@/shared/utils/helpers';
import { MAX_TEXT_LENGTH } from '@/core/constants';
import { Logger } from '@/core/services/Logger';
import { CorrectionStyle, Language, ExecutionStep, CorrectionResult } from '@/shared/types';

export interface CorrectionActionsConfig {
  text: string;
  selectedModel: string;
  selectedStyle: CorrectionStyle;
  correctionLanguage: Language;
  step: ExecutionStep;
  result: CorrectionResult | null;
  isBusy: boolean;
  runCorrection: (
    text: string,
    model: string,
    style: CorrectionStyle,
    language?: Language,
  ) => Promise<CorrectionResult>;
  reset: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  showToast: (message: string, variant: 'success' | 'error' | 'info' | 'warning') => void;
  updateModelCache: (cached: boolean) => void;
  hasPendingMismatch: (lang: Language) => boolean;
  onMismatchDetected: (lang: Language) => void;
  clearMismatch: () => void;
}

export interface CorrectionActionsResult {
  handleCorrect: (ignoreMismatch?: boolean, langOverride?: Language) => Promise<void>;
  isResultStale: boolean;
  lastAutoRunKey: React.MutableRefObject<string | null>;
  shouldAutoRunRef: React.MutableRefObject<boolean>;
}

/**
 * Hook for managing all correction-related actions including:
 * - Running corrections with language mismatch detection
 * - Tracking result staleness (when input changes after correction)
 * - Managing auto-run behavior
 *
 * @param config - Configuration object with dependencies
 * @returns Correction action handlers and state
 */
export function useCorrectionActions(config: CorrectionActionsConfig): CorrectionActionsResult {
  const {
    text,
    selectedModel,
    selectedStyle,
    correctionLanguage,
    result,
    runCorrection,
    t,
    showToast,
    updateModelCache,
    hasPendingMismatch,
    onMismatchDetected,
    clearMismatch,
  } = config;

  const lastAutoRunKey = useRef<string | null>(null);
  const shouldAutoRunRef = useRef<boolean>(false);

  /**
   * Checks if the current result is stale (input changed after correction)
   */
  const isResultStale = useMemo(() => {
    if (!result || !text.trim()) return false;
    return lastAutoRunKey.current !== generateCacheKey(selectedModel, text, selectedStyle, correctionLanguage);
  }, [result, selectedModel, text, selectedStyle, correctionLanguage]);

  /**
   * Handles the correction action with language mismatch detection
   * @param ignoreMismatch - Skip language mismatch warning
   * @param langOverride - Override the target language
   */
  const handleCorrect = useCallback(
    async (ignoreMismatch = false, langOverride?: Language) => {
      const trimmed = text.trim();
      if (!trimmed || config.isBusy) return;

      if (trimmed.length > MAX_TEXT_LENGTH) {
        showToast(t('errors.content_too_long'), 'warning');
        return;
      }

      // Check for language mismatch before proceeding
      const targetLang = langOverride || correctionLanguage;
      if (!ignoreMismatch && hasPendingMismatch(targetLang)) {
        const detected = detectDominantLanguage(trimmed);
        if (detected) {
          onMismatchDetected(detected);
        }
        return;
      }

      // Clear mismatch state when proceeding
      clearMismatch();

      try {
        const usedLang = langOverride || correctionLanguage;
        await runCorrection(trimmed, selectedModel, selectedStyle, usedLang);
        lastAutoRunKey.current = generateCacheKey(selectedModel, trimmed, selectedStyle, usedLang);
        shouldAutoRunRef.current = false;

        // Update cache status after successful correction
        const cached = await WebLLMProvider.isModelCached(selectedModel);
        updateModelCache(cached);
        showToast(t('messages.correction_success'), 'success');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        Logger.error('CorrectionActions', 'Correction error', { error: errorMessage });
        showToast(errorMessage, 'error');
      }
    },
    [
      text,
      config.isBusy,
      correctionLanguage,
      hasPendingMismatch,
      onMismatchDetected,
      clearMismatch,
      runCorrection,
      selectedModel,
      selectedStyle,
      updateModelCache,
      t,
      showToast,
    ],
  );

  return {
    handleCorrect,
    isResultStale,
    lastAutoRunKey,
    shouldAutoRunRef,
  };
}
