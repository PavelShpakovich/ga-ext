import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useAI } from '@/shared/hooks/useAI';
import { usePendingText } from '@/shared/hooks/usePendingText';
import { WebLLMProvider, ProviderFactory } from '@/core/providers';
import { useDownloadProgress } from '@/shared/hooks/useDownloadProgress';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useSettings } from '@/shared/hooks/useSettings';
import { useModelSelection } from '@/shared/hooks/useModelSelection';
import { generateCacheKey } from '@/shared/utils/helpers';
import { Logger } from '@/core/services/Logger';
import { SidebarHeader } from '@/features/settings/SidebarHeader';
import { ModelSection } from '@/features/models/ModelSection';
import { TextSection } from '@/features/correction/TextSection';
import { ResultSection } from '@/features/correction/ResultSection';
import { useTranslation } from 'react-i18next';
import { Modal, ModalVariant } from '@/shared/components/ui';
import { StyleSelector } from '@/features/settings/StyleSelector';
import { CorrectionStyle, ModelOption, ExecutionStep } from '@/shared/types';

// --- Constants ---
const AUTO_HIDE_DELAY = 3500;

const SidePanelContent: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingModel, setIsRemovingModel] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isModelCached, setIsModelCached] = useState(false);

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
  const { selectGroups, allModels, getModelInfo } = useModelSelection();
  const { downloadProgress, stopDownload } = useDownloadProgress();
  const { runCorrection, step, error, result, reset } = useAI();

  const selectedModel = settings.selectedModel;
  const modelInfo = useMemo(() => getModelInfo(selectedModel), [selectedModel, getModelInfo]);
  const isBusy =
    step === ExecutionStep.PREPARING_MODEL ||
    step === ExecutionStep.CORRECTING ||
    isPrefetching ||
    isDeleting ||
    isRemovingModel;

  const isResultStale = useMemo(() => {
    if (!result || !text.trim()) return false;
    return lastAutoRunKey.current !== generateCacheKey(selectedModel, text);
  }, [result, selectedModel, text]);

  const modelOptions = selectGroups.length
    ? selectGroups
    : [
        {
          label: 'Models',
          options: allModels.map((m: ModelOption) => ({ value: m.id, label: m.name })),
        },
      ];

  const handleModelChange = useCallback(
    (id: string) => {
      if (id === selectedModel) return;
      updateSettings({ selectedModel: id });
      ProviderFactory.clearInstances();
      lastAutoRunKey.current = null;
      shouldAutoRunRef.current = false;
    },
    [updateSettings, selectedModel],
  );

  const handleStyleChange = useCallback(
    (style: CorrectionStyle) => {
      updateSettings({ selectedStyle: style });
      lastAutoRunKey.current = null;
      shouldAutoRunRef.current = true;
    },
    [updateSettings],
  );

  const handleCorrect = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
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
  }, [text, selectedModel, isBusy, runCorrection, settings.selectedStyle]);

  const handlePrefetch = useCallback(async () => {
    setIsPrefetching(true);
    setLocalMessage(null);
    try {
      const provider = ProviderFactory.createProvider(selectedModel);
      await provider.ensureReady();
      setLocalMessage(t('messages.model_synced'));
      const cached = await WebLLMProvider.isModelCached(selectedModel);
      setIsModelCached(cached);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'aborted') {
        setLocalMessage(null);
      } else {
        const errorMessage = err instanceof Error ? err.message : t('messages.sync_failed');
        setLocalMessage(errorMessage);
      }
    } finally {
      setIsPrefetching(false);
    }
  }, [selectedModel, t]);

  const handleRemoveModel = useCallback(async () => {
    setModalConfig({
      isOpen: true,
      title: t('ui.flush_cache'),
      message: t('messages.confirm_remove_model'),
      variant: ModalVariant.DANGER,
      onConfirm: async () => {
        setIsRemovingModel(true);
        try {
          await WebLLMProvider.deleteModel(selectedModel);
          setLocalMessage(t('messages.model_removed'));
          setIsModelCached(false);
          reset();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : t('messages.removal_failed');
          setLocalMessage(errorMessage);
        } finally {
          setIsRemovingModel(false);
        }
      },
    });
  }, [selectedModel, reset, t]);

  const handleClearCache = useCallback(async () => {
    setModalConfig({
      isOpen: true,
      title: t('ui.purge_storage'),
      message: t('messages.confirm_clear_cache'),
      variant: ModalVariant.DANGER,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await WebLLMProvider.clearCache();
          setLocalMessage(t('messages.cache_cleared'));
          setIsModelCached(false);
          reset();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : t('messages.cache_failed');
          setLocalMessage(errorMessage);
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [reset, t]);

  const handleCopy = useCallback(() => {
    if (result?.corrected) {
      navigator.clipboard.writeText(result.corrected);
      setLocalMessage(t('messages.copied'));
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
  );

  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed || isBusy || !shouldAutoRunRef.current) return;

    const key = generateCacheKey(selectedModel, trimmed);
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
      } catch {
        lastAutoRunKey.current = key;
        shouldAutoRunRef.current = false;
      }
    };

    triggerAutoRun();
  }, [isBusy, runCorrection, selectedModel, text, settings.selectedStyle]);

  useEffect(() => {
    let mounted = true;
    WebLLMProvider.isModelCached(selectedModel).then((cached) => {
      if (mounted) setIsModelCached(cached);
    });
    return () => {
      mounted = false;
    };
  }, [selectedModel, isPrefetching, isRemovingModel, isDeleting, step]);

  return (
    <div className='h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40'>
      <SidebarHeader title={t('ui.title')} subtitle={t('ui.subtitle')} isModelCached={isModelCached} />

      <main className='flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth'>
        <ModelSection
          title={t('ui.model_section')}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          modelOptions={modelOptions}
          modelInfo={modelInfo}
          isModelCached={isModelCached}
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
          onRecheck={handleCorrect}
          disabled={isBusy || (!text.trim() && !!result)}
        />

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
    </div>
  );
};

const SidePanel: React.FC = () => (
  <ErrorBoundary>
    <SidePanelContent />
  </ErrorBoundary>
);

export default SidePanel;
