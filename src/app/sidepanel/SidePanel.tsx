import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useAI } from '@/shared/hooks/useAI';
import { usePendingText } from '@/shared/hooks/usePendingText';
import { WebLLMProvider, ProviderFactory } from '@/core/providers';
import { useDownloadProgress } from '@/shared/hooks/useDownloadProgress';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useSettings } from '@/shared/hooks/useSettings';
import { useModelSelection } from '@/shared/hooks/useModelSelection';
import { generateCacheKey, detectDominantLanguage } from '@/shared/utils/helpers';
import { MAX_TEXT_LENGTH, LANGUAGE_CONFIG, AUTO_HIDE_MESSAGE_DELAY, CACHE_CHECK_TIMEOUT_MS } from '@/core/constants';
import { Logger } from '@/core/services/Logger';
import { SidebarHeader } from '@/features/settings/SidebarHeader';
import { StyleSelector } from '@/features/settings/StyleSelector';
import { ModelSection } from '@/features/models/ModelSection';
import { TextSection } from '@/features/correction/TextSection';
import { ResultSection } from '@/features/correction/ResultSection';
import { useTranslation } from 'react-i18next';
import { Button, ButtonVariant, ButtonSize } from '@/shared/components/Button';
import { Modal, ModalVariant, Toast, Alert, AlertVariant, TextButton, TextButtonVariant } from '@/shared/components/ui';
import { CorrectionStyle, ModelOption, ExecutionStep, Language } from '@/shared/types';

const SidePanelContent: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [localMessage, setLocalMessage] = useState<{ message: string; variant: AlertVariant } | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingModel, setIsRemovingModel] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isModelCached, setIsModelCached] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [mismatchDetected, setMismatchDetected] = useState<Language | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: ModalVariant;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const lastAutoRunKey = useRef<string | null>(null);
  const shouldAutoRunRef = useRef<boolean>(false);
  const confirmedLanguageRef = useRef<Language | null>(null);

  const { settings, updateSettings } = useSettings();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
    action?: { label: string; onClick: () => void };
  }>({
    message: '',
    variant: 'info',
    isVisible: false,
  });

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    shouldAutoRunRef.current = false;

    if (!val.trim()) {
      setMismatchDetected(null);
      confirmedLanguageRef.current = null;
    }
  }, []);

  // Unified language mismatch detection
  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setMismatchDetected(null);
      confirmedLanguageRef.current = null;
      return;
    }

    const detected = detectDominantLanguage(trimmed);
    if (detected && detected !== settings.correctionLanguage && confirmedLanguageRef.current !== detected) {
      setMismatchDetected(detected);
    } else {
      setMismatchDetected(null);
    }
  }, [settings.correctionLanguage, text]);

  const showToast = useCallback(
    (
      message: string,
      variant: 'success' | 'error' | 'info' | 'warning' = 'info',
      action?: { label: string; onClick: () => void },
    ) => {
      setToast({ message, variant, isVisible: true, action });
    },
    [],
  );
  const { selectGroups, allModels, getModelInfo } = useModelSelection();
  const { downloadProgress, stopDownload } = useDownloadProgress();
  const { runCorrection, step, error, result, partialResult, reset } = useAI();

  const selectedModel = settings.selectedModel;
  const modelInfo = useMemo(() => getModelInfo(selectedModel), [selectedModel, getModelInfo]);
  const isBusy =
    step === ExecutionStep.PREPARING_MODEL ||
    step === ExecutionStep.CORRECTING ||
    isPrefetching ||
    isDeleting ||
    isRemovingModel ||
    isCheckingCache;

  const isResultStale = useMemo(() => {
    if (!result || !text.trim()) return false;
    // Account for confirmed language override in staleness check
    const effectiveLanguage = confirmedLanguageRef.current || settings.correctionLanguage;
    return lastAutoRunKey.current !== generateCacheKey(selectedModel, text, settings.selectedStyle, effectiveLanguage);
  }, [result, selectedModel, text, settings.selectedStyle, settings.correctionLanguage]);

  // Clear mismatch warning and confirmation when the target language is changed manually
  // Also invalidate the last auto-run key to allow re-running with new language
  useEffect(() => {
    confirmedLanguageRef.current = null;
    lastAutoRunKey.current = null; // Force cache key refresh on language change
    if (mismatchDetected && mismatchDetected === settings.correctionLanguage) {
      setMismatchDetected(null);
    }
  }, [settings.correctionLanguage, mismatchDetected]);

  const modelOptions = selectGroups.length
    ? selectGroups
    : [
        {
          label: 'Models',
          options: allModels.map((m: ModelOption) => ({ value: m.id, label: m.name })),
        },
      ];

  const handleModelChange = useCallback(
    async (id: string) => {
      if (isBusy) return; // prevent changing model while busy
      if (id === selectedModel) return;

      // Immediately stop download and clear progress to prevent flashing
      if (downloadProgress) {
        stopDownload();
      }

      // 1. Reset states IMMEDIATELY and CLEAR the engine
      setIsCheckingCache(true);
      setIsModelCached(false);
      // Clear language override context when switching models to avoid carrying over user's previous choice
      confirmedLanguageRef.current = null;
      // Clear the cache key to prevent stale result comparisons from previous model
      lastAutoRunKey.current = null;
      reset();

      try {
        // 2. Perform engine cleanup first
        await ProviderFactory.clearInstances();

        // 3. Update settings (this triggers re-render and useEffect)
        await updateSettings({ selectedModel: id });

        shouldAutoRunRef.current = false;

        // Note: isCheckingCache and isModelCached will be finalized by the useEffect triggered by selectedModel change
      } catch (err) {
        Logger.error('SidePanel', 'Failed to change model', err);
        setIsCheckingCache(false);
      }
    },
    [updateSettings, selectedModel, downloadProgress, stopDownload, isBusy, reset],
  );

  const handleStyleChange = useCallback(
    (style: CorrectionStyle) => {
      if (isBusy) return; // prevent changing style while busy
      updateSettings({ selectedStyle: style });
      lastAutoRunKey.current = null;
      shouldAutoRunRef.current = false;
    },
    [updateSettings, isBusy],
  );

  const handleCorrect = useCallback(
    async (ignoreMismatch = false, langOverride?: Language) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;

      if (trimmed.length > MAX_TEXT_LENGTH) {
        showToast(t('errors.content_too_long'), 'warning');
        return;
      }

      // Basic language check to warn about potential mismatch
      const detected = detectDominantLanguage(trimmed);
      const targetLang = langOverride || settings.correctionLanguage;

      if (!ignoreMismatch && detected && detected !== targetLang && confirmedLanguageRef.current !== detected) {
        setMismatchDetected(detected);
        return;
      }

      // Reset mismatch state if we're proceeding or it matches
      setMismatchDetected(null);

      try {
        const usedLang = langOverride || settings.correctionLanguage;
        await runCorrection(trimmed, selectedModel, settings.selectedStyle, usedLang);
        lastAutoRunKey.current = generateCacheKey(selectedModel, trimmed, settings.selectedStyle, usedLang);
        shouldAutoRunRef.current = false;
        // Clear the confirmed language override after successful correction
        confirmedLanguageRef.current = null;
        const cached = await WebLLMProvider.isModelCached(selectedModel);
        setIsModelCached(cached);
        showToast(t('messages.correction_success'), 'success');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        Logger.error('SidePanel', 'Correction error', { error: errorMessage });
        showToast(errorMessage, 'error');
      }
    },
    [text, isBusy, t, settings.correctionLanguage, showToast, runCorrection, selectedModel, settings.selectedStyle],
  );

  const handlePrefetch = useCallback(async () => {
    if (isBusy) return;
    setIsPrefetching(true);
    setLocalMessage(null);
    try {
      const provider = await ProviderFactory.createProvider(selectedModel);
      await provider.ensureReady();
      setLocalMessage({ message: t('messages.model_synced'), variant: AlertVariant.SUCCESS });
      const cached = await WebLLMProvider.isModelCached(selectedModel);
      setIsModelCached(cached);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'aborted') {
        setLocalMessage(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : t('messages.sync_failed');
        setLocalMessage({ message: errorMessage, variant: AlertVariant.ERROR });
      }
    } finally {
      setIsPrefetching(false);
    }
  }, [selectedModel, t, isBusy]);

  const handleRemoveModel = useCallback(async () => {
    if (isBusy) return;
    setModalConfig({
      isOpen: true,
      title: t('ui.flush_cache'),
      message: t('messages.confirm_remove_model'),
      variant: ModalVariant.DANGER,
      onConfirm: async () => {
        setIsRemovingModel(true);
        try {
          // deleteModel now includes its own verification logic
          await WebLLMProvider.deleteModel(selectedModel);
          await ProviderFactory.clearInstances();

          setLocalMessage({ message: t('messages.model_removed'), variant: AlertVariant.SUCCESS });
          setIsModelCached(false);
          reset();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : t('messages.removal_failed');
          setLocalMessage({ message: errorMessage, variant: AlertVariant.ERROR });
        } finally {
          setIsRemovingModel(false);
        }
      },
    });
  }, [selectedModel, reset, t, isBusy]);

  const handleClearCache = useCallback(async () => {
    if (isBusy) return;
    setModalConfig({
      isOpen: true,
      title: t('ui.purge_storage'),
      message: t('messages.confirm_clear_cache'),
      variant: ModalVariant.DANGER,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          // Robust cleanup: stop all active engines before clearing storage
          await ProviderFactory.clearInstances();
          await WebLLMProvider.clearCache();
          setLocalMessage({ message: t('messages.cache_cleared'), variant: AlertVariant.SUCCESS });
          setIsModelCached(false);
          reset();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : t('messages.cache_failed');
          setLocalMessage({ message: errorMessage, variant: AlertVariant.ERROR });
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [reset, t, isBusy]);

  const handleCopy = useCallback(() => {
    if (result?.corrected) {
      navigator.clipboard.writeText(result.corrected);
      setLocalMessage({ message: t('messages.copied'), variant: AlertVariant.SUCCESS });
    }
  }, [result, t]);

  useEffect(() => {
    if (localMessage) {
      const timer = setTimeout(() => setLocalMessage(null), AUTO_HIDE_MESSAGE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [localMessage]);

  usePendingText(
    useCallback(
      (incoming: string, options) => {
        handleTextChange(incoming);
        reset();
        if (options?.autoRun) {
          shouldAutoRunRef.current = true;
        }
      },
      [reset, handleTextChange],
    ),
    useCallback(
      (error: string) => {
        if (error === 'TOO_LONG') {
          showToast(t('errors.content_too_long'), 'warning');
        } else {
          showToast(error, 'error');
        }
      },
      [showToast, t],
    ),
  );

  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed || isBusy || !shouldAutoRunRef.current) return;

    if (trimmed.length > MAX_TEXT_LENGTH) {
      showToast(t('errors.content_too_long'), 'warning');
      shouldAutoRunRef.current = false;
      return;
    }

    const key = generateCacheKey(selectedModel, trimmed, settings.selectedStyle, settings.correctionLanguage);
    if (lastAutoRunKey.current === key) {
      shouldAutoRunRef.current = false;
      return;
    }

    // Check for language mismatch before auto-running
    const detected = detectDominantLanguage(trimmed);
    if (detected && detected !== settings.correctionLanguage && confirmedLanguageRef.current !== detected) {
      setMismatchDetected(detected);
      shouldAutoRunRef.current = false;
      return;
    }

    const triggerAutoRun = async () => {
      try {
        await runCorrection(trimmed, selectedModel, settings.selectedStyle);
        lastAutoRunKey.current = key;
        shouldAutoRunRef.current = false;
        const cached = await WebLLMProvider.isModelCached(selectedModel);
        setIsModelCached(cached);
      } catch (err: unknown) {
        lastAutoRunKey.current = key;
        shouldAutoRunRef.current = false;
        const errorMessage = err instanceof Error ? err.message : String(err);
        Logger.error('SidePanel', 'Auto-run correction failed', { error: errorMessage });
      }
    };

    triggerAutoRun();
  }, [isBusy, runCorrection, selectedModel, text, settings.selectedStyle, settings.correctionLanguage, showToast, t]);

  useEffect(() => {
    let mounted = true;
    setIsCheckingCache(true);
    setIsModelCached(false); // Reset cache state for the new model

    // Safety timeout for IndexedDB access (sometimes hangs in Chrome if another tab is locking it)
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setIsCheckingCache(false);
        Logger.warn('SidePanel', 'Cache check timed out');
      }
    }, CACHE_CHECK_TIMEOUT_MS);

    WebLLMProvider.isModelCached(selectedModel)
      .then((cached) => {
        if (mounted) setIsModelCached(cached);
      })
      .catch((err) => {
        Logger.error('SidePanel', 'Cache check failed', err);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (mounted) setIsCheckingCache(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [selectedModel]);

  return (
    <div className='h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40'>
      <SidebarHeader title={t('ui.title')} subtitle={t('ui.subtitle')} isBusy={isBusy} />

      <main className='flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth'>
        <ModelSection
          title={t('ui.model_section')}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          modelOptions={modelOptions}
          modelInfo={modelInfo}
          isModelCached={isModelCached}
          isCheckingCache={isCheckingCache}
          isPrefetching={isPrefetching}
          isRemovingModel={isRemovingModel}
          isBusy={isBusy}
          step={step}
          downloadProgress={downloadProgress}
          onPrefetch={handlePrefetch}
          onRemoveModel={handleRemoveModel}
          onStopDownload={stopDownload}
        />

        <StyleSelector
          selected={settings.selectedStyle}
          onChange={handleStyleChange}
          disabled={isBusy || (!text.trim() && !!result)}
        />

        <TextSection
          title={`${t('ui.text_section')} (${LANGUAGE_CONFIG[settings.correctionLanguage].name})`}
          text={text}
          onTextChange={handleTextChange}
          onClear={() => {
            setText('');
            reset();
            confirmedLanguageRef.current = null;
            setMismatchDetected(null);
          }}
          onCorrect={handleCorrect}
          isBusy={isBusy}
          hasResult={!!result}
          isResultStale={isResultStale}
          placeholder={t('ui.text_placeholder')}
          emptyHint={t('ui.empty_text_hint')}
        />

        {mismatchDetected && (
          <Alert variant={AlertVariant.WARNING} className='mx-0 mt-0 mb-4'>
            <div className='flex flex-col gap-3'>
              <div className='text-sm leading-relaxed'>
                <span className='font-medium'>{t('messages.language_mismatch_detected')}</span>{' '}
                {t('messages.language_mismatch_description', {
                  detected: LANGUAGE_CONFIG[mismatchDetected].name,
                  selected: LANGUAGE_CONFIG[settings.correctionLanguage].name,
                })}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant={ButtonVariant.PRIMARY}
                  size={ButtonSize.SM}
                  onClick={() => {
                    const newLang = mismatchDetected;
                    updateSettings({ correctionLanguage: newLang });
                    setMismatchDetected(null);
                    handleCorrect(true, newLang);
                  }}
                >
                  {t('messages.switch_to', { lang: LANGUAGE_CONFIG[mismatchDetected].name })}
                </Button>
                <TextButton
                  variant={TextButtonVariant.DEFAULT}
                  onClick={() => {
                    confirmedLanguageRef.current = mismatchDetected;
                    setMismatchDetected(null);
                    handleCorrect(true);
                  }}
                >
                  {t('messages.ignore_and_correct')}
                </TextButton>
              </div>
            </div>
          </Alert>
        )}

        <ResultSection
          title={t('ui.result_section')}
          reasoningLabel={t('ui.reasoning_label')}
          result={result}
          partialResult={partialResult}
          onCopy={handleCopy}
          showDebug={showDebug}
          onToggleDebug={() => setShowDebug(!showDebug)}
          onClearCache={handleClearCache}
          localMessage={localMessage}
          error={error}
          step={step}
          isBusy={isBusy}
        />
      </main>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        confirmLabel={t('ui.confirm')}
        cancelLabel={t('ui.cancel')}
      />

      <Toast
        message={toast.message}
        variant={toast.variant}
        isVisible={toast.isVisible}
        onClose={hideToast}
        action={toast.action}
      />
    </div>
  );
};

const SidePanel: React.FC = () => (
  <ErrorBoundary>
    <SidePanelContent />
  </ErrorBoundary>
);

export default SidePanel;
