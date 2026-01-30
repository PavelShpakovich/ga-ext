import { useCallback } from 'react';
import { Language, CorrectionStyle, CorrectionResult, Settings } from '@/shared/types';
import { WebLLMProvider, ProviderFactory } from '@/core/providers';
import { Logger } from '@/core/services/Logger';
import { generateCacheKey, detectDominantLanguage } from '@/shared/utils/helpers';
import { MAX_TEXT_LENGTH } from '@/core/constants';

/**
 * Callback signatures used in correction workflow
 */
export interface WorkflowCallbacks {
  showToast: (message: string, variant: 'success' | 'error' | 'info' | 'warning') => void;
  setMismatchDetected: (lang: Language | null) => void;
  setIsModelCached: (value: boolean) => void;
  setLocalMessage: (msg: { message: string; variant: string } | null) => void;
}

/**
 * Refs used in correction workflow
 */
export interface WorkflowRefs {
  lastAutoRunKey: { current: string | null };
  confirmedLanguageRef: { current: Language | null };
}

/**
 * Custom hook for correction workflow orchestration
 * Consolidates:
 * - Language detection and mismatch handling
 * - Cache validation and staleness checking
 * - Correction execution and result handling
 * - Model state management
 *
 * Reduces SidePanel complexity by extracting correction logic
 */
export const useCorrectionWorkflow = (
  selectedModel: string,
  text: string,
  settings: Settings,
  runCorrection: (
    text: string,
    modelId: string,
    style?: CorrectionStyle,
    langOverride?: Language,
  ) => Promise<CorrectionResult>,
  callbacks: WorkflowCallbacks,
  refs: WorkflowRefs,
  t: (key: string) => string,
) => {
  /**
   * Execute correction with optional language override
   * Handles:
   * 1. Language mismatch detection
   * 2. Correction execution
   * 3. Cache key tracking
   * 4. Language override cleanup
   */
  const handleCorrect = useCallback(
    async (ignoreMismatch = false, langOverride?: Language) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (trimmed.length > MAX_TEXT_LENGTH) {
        callbacks.showToast(t('errors.content_too_long'), 'warning');
        return;
      }

      // Language mismatch detection
      const detected = detectDominantLanguage(trimmed);
      const targetLang = langOverride || settings.correctionLanguage;

      if (!ignoreMismatch && detected && detected !== targetLang && refs.confirmedLanguageRef.current !== detected) {
        callbacks.setMismatchDetected(detected);
        return;
      }

      // Reset mismatch state if we're proceeding
      callbacks.setMismatchDetected(null);

      try {
        const usedLang = langOverride || settings.correctionLanguage;
        await runCorrection(trimmed, selectedModel, settings.selectedStyle, usedLang);

        // Track cache key for staleness checks
        refs.lastAutoRunKey.current = generateCacheKey(selectedModel, trimmed, settings.selectedStyle, usedLang);

        // Clear the confirmed language override after successful correction
        refs.confirmedLanguageRef.current = null;

        // Update cache status
        const cached = await WebLLMProvider.isModelCached(selectedModel);
        callbacks.setIsModelCached(cached);

        callbacks.showToast(t('messages.correction_success'), 'success');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        Logger.error('CorrectionWorkflow', 'Correction error', { error: errorMessage });
        callbacks.showToast(errorMessage, 'error');
      }
    },
    [text, selectedModel, settings, runCorrection, callbacks, refs, t],
  );

  /**
   * Handle language mismatch override
   * Records the user's choice to use a different language
   */
  const handleIgnoreLanguageMismatch = useCallback(
    (detectedLang: Language) => {
      refs.confirmedLanguageRef.current = detectedLang;
      handleCorrect(true, detectedLang);
    },
    [handleCorrect, refs],
  );

  /**
   * Prefetch (sync) model to local cache
   * Shows progress and updates cache status
   */
  const handlePrefetch = useCallback(async () => {
    callbacks.setLocalMessage(null);
    try {
      const provider = await ProviderFactory.createProvider(selectedModel);
      await provider.ensureReady();
      callbacks.setLocalMessage({ message: t('messages.model_synced'), variant: 'success' });

      const cached = await WebLLMProvider.isModelCached(selectedModel);
      callbacks.setIsModelCached(cached);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'aborted') {
        callbacks.setLocalMessage(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : t('messages.sync_failed');
        callbacks.setLocalMessage({ message: errorMessage, variant: 'error' });
      }
    }
  }, [selectedModel, callbacks, t]);

  /**
   * Remove model from local cache
   * Triggers confirmation modal before deletion
   */
  const handleRemoveModel = useCallback(
    async (onConfirm?: () => Promise<void>) => {
      try {
        await WebLLMProvider.deleteModel(selectedModel);
        await ProviderFactory.clearInstances();

        callbacks.setLocalMessage({ message: t('messages.model_removed'), variant: 'success' });
        callbacks.setIsModelCached(false);

        if (onConfirm) {
          await onConfirm();
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : t('messages.removal_failed');
        callbacks.setLocalMessage({ message: errorMessage, variant: 'error' });
        Logger.error('CorrectionWorkflow', 'Failed to remove model', { error: errorMessage });
      }
    },
    [selectedModel, callbacks, t],
  );

  /**
   * Clear all cached models
   * Triggers confirmation modal before clearing
   */
  const handleClearCache = useCallback(
    async (onConfirm?: () => Promise<void>) => {
      try {
        await ProviderFactory.clearInstances();
        await WebLLMProvider.clearCache();

        callbacks.setLocalMessage({ message: t('messages.cache_cleared'), variant: 'success' });
        callbacks.setIsModelCached(false);

        if (onConfirm) {
          await onConfirm();
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : t('messages.cache_failed');
        callbacks.setLocalMessage({ message: errorMessage, variant: 'error' });
        Logger.error('CorrectionWorkflow', 'Failed to clear cache', { error: errorMessage });
      }
    },
    [callbacks, t],
  );

  return {
    handleCorrect,
    handleIgnoreLanguageMismatch,
    handlePrefetch,
    handleRemoveModel,
    handleClearCache,
  };
};
