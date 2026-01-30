import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useAI } from '@/shared/hooks/useAI';
import { usePendingText } from '@/shared/hooks/usePendingText';
import { WebLLMProvider, ProviderFactory } from '@/core/providers';
import { useDownloadProgress } from '@/shared/hooks/useDownloadProgress';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useSettings } from '@/shared/hooks/useSettings';
import { useModelSelection } from '@/shared/hooks/useModelSelection';
import { generateCacheKey } from '@/shared/utils/helpers';
import { MAX_TEXT_LENGTH } from '@/core/constants';
import { Logger } from '@/core/services/Logger';
import { SidebarHeader } from '@/features/settings/SidebarHeader';
import { StyleSelector } from '@/features/settings/StyleSelector';
import { LanguageSelector } from '@/features/settings/LanguageSelector';
import { ModelSection } from '@/features/models/ModelSection';
import { TextSection } from '@/features/correction/TextSection';
import { ResultSection } from '@/features/correction/ResultSection';
import { useTranslation } from 'react-i18next';
import { Modal, ModalVariant, Toast, AlertVariant } from '@/shared/components/ui';
import { CorrectionStyle, ModelOption, ExecutionStep } from '@/shared/types';

// --- Constants ---
const AUTO_HIDE_DELAY = 3500;

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

  const { settings, updateSettings } = useSettings();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
  }>({
    message: '',
    variant: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, variant: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, variant, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);
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
    return lastAutoRunKey.current !== generateCacheKey(selectedModel, text, settings.selectedStyle);
  }, [result, selectedModel, text, settings.selectedStyle]);

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
      // Reset cache checking state to show loading on new model
      setIsCheckingCache(true);
      setIsModelCached(false);
      updateSettings({ selectedModel: id });
      await ProviderFactory.clearInstances();
      lastAutoRunKey.current = null;
      shouldAutoRunRef.current = false;
    },
    [updateSettings, selectedModel, downloadProgress, stopDownload, isBusy],
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

  const handleCorrect = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    if (trimmed.length > MAX_TEXT_LENGTH) {
      showToast(t('errors.content_too_long'), 'warning');
      return;
    }

    try {
      await runCorrection(trimmed, selectedModel, settings.selectedStyle);
      lastAutoRunKey.current = generateCacheKey(selectedModel, trimmed);
      shouldAutoRunRef.current = false;
      const cached = await WebLLMProvider.isModelCached(selectedModel);
      setIsModelCached(cached);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Logger.error('SidePanel', 'Correction error', { error: errorMessage });
    }
  }, [text, selectedModel, isBusy, runCorrection, settings.selectedStyle, showToast, t]);

  const handlePrefetch = useCallback(async () => {
    if (isBusy) return;
    setIsPrefetching(true);
    setLocalMessage(null);
    try {
      const provider = ProviderFactory.createProvider(selectedModel);
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
          await WebLLMProvider.deleteModel(selectedModel);
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
      const timer = setTimeout(() => setLocalMessage(null), AUTO_HIDE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [localMessage]);

  usePendingText(
    useCallback(
      (incoming: string, options) => {
        setText(incoming);
        reset();
        if (options?.autoRun) {
          shouldAutoRunRef.current = true;
        }
      },
      [reset],
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

    const key = generateCacheKey(selectedModel, trimmed, settings.selectedStyle);
    if (lastAutoRunKey.current === key) {
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
  }, [isBusy, runCorrection, selectedModel, text, settings.selectedStyle, showToast, t]);

  useEffect(() => {
    let mounted = true;
    setIsCheckingCache(true);
    WebLLMProvider.isModelCached(selectedModel)
      .then((cached) => {
        if (mounted) setIsModelCached(cached);
      })
      .finally(() => {
        if (mounted) setIsCheckingCache(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedModel]);

  return (
    <div className='h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40'>
      <SidebarHeader title={t('ui.title')} subtitle={t('ui.subtitle')} isModelCached={isModelCached} />

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

        <LanguageSelector />

        <TextSection
          title={t('ui.text_section')}
          text={text}
          onTextChange={(val) => {
            setText(val);
            shouldAutoRunRef.current = false;
          }}
          onClear={() => {
            setText('');
            reset();
          }}
          onCorrect={handleCorrect}
          isBusy={isBusy}
          hasResult={!!result}
          isResultStale={isResultStale}
          placeholder={t('ui.text_placeholder')}
          emptyHint={t('ui.empty_text_hint')}
        />

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

      <Toast message={toast.message} variant={toast.variant} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
};

const SidePanel: React.FC = () => (
  <ErrorBoundary>
    <SidePanelContent />
  </ErrorBoundary>
);

export default SidePanel;
