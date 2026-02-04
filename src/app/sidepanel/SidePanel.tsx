import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useAI } from '@/shared/hooks/useAI';
import { usePendingText } from '@/shared/hooks/usePendingText';
import { WebLLMProvider, ProviderFactory } from '@/core/providers';
import { useDownloadProgress } from '@/shared/hooks/useDownloadProgress';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useSettings } from '@/shared/hooks/useSettings';
import { useModelSelection } from '@/shared/hooks/useModelSelection';
import { useLanguageMismatch } from '@/shared/hooks/useLanguageMismatch';
import { useToastNotifications } from '@/shared/hooks/useToastNotifications';
import { useCorrectionActions } from '@/shared/hooks/useCorrectionActions';
import { generateCacheKey } from '@/shared/utils/helpers';
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
import { CorrectionStyle, ModelOption, ExecutionStep, ToastVariant, Language } from '@/shared/types';

const SidePanelContent: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [localMessage, setLocalMessage] = useState<{ message: string; variant: AlertVariant } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isModelCached, setIsModelCached] = useState(false);
  const [systemStep, setSystemStep] = useState<ExecutionStep>(ExecutionStep.IDLE);

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

  const { settings, updateSettings } = useSettings();
  const { toast, showToast, hideToast } = useToastNotifications();
  const { mismatchDetected, clearMismatch, confirmDetectedLanguage, hasPendingMismatch } = useLanguageMismatch(
    text,
    settings.correctionLanguage,
  );

  const { selectGroups, allModels, getModelInfo } = useModelSelection();
  const { downloadProgress, stopDownload } = useDownloadProgress();
  const { runCorrection, step, error, result, partialResult, reset } = useAI();

  // Determine current step: system operations take precedence over correction step
  const currentStep = systemStep !== ExecutionStep.IDLE ? systemStep : step;
  const isBusy =
    currentStep !== ExecutionStep.IDLE && currentStep !== ExecutionStep.DONE && currentStep !== ExecutionStep.ERROR;

  const { handleCorrect, isResultStale, lastAutoRunKey, shouldAutoRunRef } = useCorrectionActions({
    text,
    selectedModel: settings.selectedModel,
    selectedStyle: settings.selectedStyle,
    correctionLanguage: settings.correctionLanguage,
    step,
    result,
    isBusy,
    runCorrection,
    reset,
    t,
    showToast,
    updateModelCache: setIsModelCached,
    hasPendingMismatch,
    onMismatchDetected: () => {}, // Handled by useLanguageMismatch
    clearMismatch,
  });

  const handleTextChange = useCallback(
    (val: string) => {
      setText(val);
      if (shouldAutoRunRef.current) {
        shouldAutoRunRef.current = false;
      }
      if (!val.trim()) {
        clearMismatch();
      }
    },
    [clearMismatch, shouldAutoRunRef],
  );

  const selectedModel = settings.selectedModel;
  const modelInfo = useMemo(() => getModelInfo(selectedModel), [selectedModel, getModelInfo]);

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
      // Prevent race conditions - only allow one model switch at a time
      if (isBusy) {
        Logger.warn('SidePanel', 'Operation in progress, ignoring model switch request');
        return;
      }
      if (id === selectedModel) return;

      Logger.info('SidePanel', 'Starting model switch', { from: selectedModel, to: id });

      // Immediately stop download and clear progress to prevent flashing
      if (downloadProgress) {
        stopDownload();
      }

      // 1. Reset states IMMEDIATELY and CLEAR the engine
      setIsModelCached(false);
      // Clear language override context when switching models to avoid carrying over user's previous choice
      clearMismatch();
      // Clear the cache key to prevent stale result comparisons from previous model
      lastAutoRunKey.current = null;
      reset();

      try {
        // 2. Perform engine cleanup first
        await ProviderFactory.clearInstances();
        Logger.debug('SidePanel', 'Provider instances cleared');

        // 3. Update settings (this triggers re-render and useEffect)
        await updateSettings({ selectedModel: id });
        Logger.info('SidePanel', 'Model switch completed', { modelId: id });

        shouldAutoRunRef.current = false;

        // Note: Cache check useEffect will run automatically when selectedModel changes
      } catch (err) {
        Logger.error('SidePanel', 'Failed to change model', { error: err, targetModel: id });
        showToast(t('messages.model_switch_failed'), ToastVariant.ERROR);
        setSystemStep(ExecutionStep.IDLE);
      }
    },
    [
      updateSettings,
      selectedModel,
      downloadProgress,
      stopDownload,
      isBusy,
      reset,
      clearMismatch,
      lastAutoRunKey,
      shouldAutoRunRef,
      showToast,
      t,
    ],
  );

  const handleStyleChange = useCallback(
    (style: CorrectionStyle) => {
      if (isBusy) return; // prevent changing style while busy
      updateSettings({ selectedStyle: style });
      lastAutoRunKey.current = null;
      shouldAutoRunRef.current = false;
    },
    [updateSettings, isBusy, lastAutoRunKey, shouldAutoRunRef],
  );

  const handlePrefetch = useCallback(async () => {
    if (isBusy) return;
    setSystemStep(ExecutionStep.PREFETCHING);
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
      setSystemStep(ExecutionStep.IDLE);
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
        setSystemStep(ExecutionStep.REMOVING_MODEL);
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
          setSystemStep(ExecutionStep.IDLE);
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
        setSystemStep(ExecutionStep.CLEARING_CACHE);
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
          setSystemStep(ExecutionStep.IDLE);
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

  const handleSwitchLanguage = useCallback(
    async (detectedLang: Language) => {
      await updateSettings({ correctionLanguage: detectedLang });
      clearMismatch();
      handleCorrect(true, detectedLang);
    },
    [updateSettings, clearMismatch, handleCorrect],
  );

  const handleIgnoreAndCorrect = useCallback(() => {
    confirmDetectedLanguage();
    handleCorrect(true);
  }, [confirmDetectedLanguage, handleCorrect]);

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
      [reset, handleTextChange, shouldAutoRunRef],
    ),
    useCallback(
      (error: string) => {
        if (error === 'TOO_LONG') {
          showToast(t('errors.content_too_long'), ToastVariant.WARNING);
        } else {
          showToast(error, ToastVariant.ERROR);
        }
      },
      [showToast, t],
    ),
  );

  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed || isBusy || !shouldAutoRunRef.current) return;

    if (trimmed.length > MAX_TEXT_LENGTH) {
      showToast(t('errors.content_too_long'), ToastVariant.WARNING);
      shouldAutoRunRef.current = false;
      return;
    }

    const key = generateCacheKey(selectedModel, trimmed, settings.selectedStyle, settings.correctionLanguage);
    if (lastAutoRunKey.current === key) {
      shouldAutoRunRef.current = false;
      return;
    }

    // Check for language mismatch before auto-running
    if (hasPendingMismatch(settings.correctionLanguage)) {
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
  }, [
    isBusy,
    runCorrection,
    selectedModel,
    text,
    settings.selectedStyle,
    settings.correctionLanguage,
    showToast,
    t,
    hasPendingMismatch,
    lastAutoRunKey,
    shouldAutoRunRef,
  ]);

  useEffect(() => {
    let mounted = true;
    setSystemStep(ExecutionStep.CHECKING_CACHE);
    setIsModelCached(false); // Reset cache state for the new model

    // Safety timeout for IndexedDB access (sometimes hangs in Chrome if another tab is locking it)
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setSystemStep(ExecutionStep.IDLE);
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
        if (mounted) setSystemStep(ExecutionStep.IDLE);
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [selectedModel]);

  return (
    <div className='h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40'>
      <SidebarHeader title={t('ui.title')} subtitle={t('ui.subtitle')} isBusy={isBusy} />

      <main className='flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth'>
        <ModelSection
          title={t('ui.model_section')}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          modelOptions={modelOptions}
          modelInfo={modelInfo}
          isModelCached={isModelCached}
          isBusy={isBusy}
          step={currentStep}
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
            clearMismatch();
          }}
          onCorrect={handleCorrect}
          isBusy={isBusy}
          hasResult={!!result}
          isResultStale={isResultStale}
          placeholder={t('ui.text_placeholder')}
          emptyHint={t('ui.empty_text_hint')}
        />

        {mismatchDetected && (
          <Alert variant={AlertVariant.WARNING}>
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
                  onClick={() => handleSwitchLanguage(mismatchDetected)}
                >
                  {t('messages.switch_to', { lang: LANGUAGE_CONFIG[mismatchDetected].name })}
                </Button>
                <TextButton variant={TextButtonVariant.DEFAULT} onClick={handleIgnoreAndCorrect}>
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
