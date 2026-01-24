import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useAI } from '../hooks/useAI';
import { usePendingText } from '../hooks/usePendingText';
import { WebLLMProvider, ProviderFactory } from '../providers';
import { useDownloadProgress } from '../hooks/useDownloadProgress';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSettings } from '../hooks/useSettings';
import { useModelSelection } from '../hooks/useModelSelection';
import { generateCacheKey } from '../utils/helpers';
import { SidebarHeader, ModelSection, TextSection, ResultSection } from './components';

// --- Constants ---
const UI_STRINGS = {
  TITLE: 'Grammar Assistant',
  SUBTITLE: 'Local WebGPU Session',
  MODEL_SECTION: 'AI Model',
  TEXT_SECTION: 'Source Text',
  RESULT_SECTION: 'Corrected Result',
  TEXT_PLACEHOLDER: 'Start typing or paste content...',
  EMPTY_TEXT_HINT: 'Select text on any webpage or type directly here to begin.',
  REASONING_LABEL: 'Improvements & Reasoning',
} as const;

const AUTO_HIDE_DELAY = 3500;

const SidePanelContent: React.FC = () => {
  const [text, setText] = useState('');
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingModel, setIsRemovingModel] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isModelCached, setIsModelCached] = useState(false);

  const lastAutoRunKey = useRef<string | null>(null);
  const shouldAutoRunRef = useRef<boolean>(false);

  const { settings, updateSettings } = useSettings();
  const { selectGroups, allModels, getModelInfo } = useModelSelection();
  const { downloadProgress, stopDownload } = useDownloadProgress();
  const { runCorrection, step, error, result, reset } = useAI();

  const selectedModel = settings.selectedModel;
  const modelInfo = useMemo(() => getModelInfo(selectedModel), [selectedModel, getModelInfo]);
  const isBusy = step === 'preparing-model' || step === 'correcting' || isPrefetching || isDeleting || isRemovingModel;

  const isResultStale = useMemo(() => {
    if (!result || !text.trim()) return false;
    return lastAutoRunKey.current !== generateCacheKey(selectedModel, text);
  }, [result, selectedModel, text]);

  const modelOptions = selectGroups.length
    ? selectGroups
    : [
        {
          label: 'Models',
          options: allModels.map((m) => ({ value: m.id, label: m.name })),
        },
      ];

  const handleModelChange = useCallback(
    (id: string) => {
      updateSettings({ selectedModel: id });
      ProviderFactory.clearInstances();
      lastAutoRunKey.current = null;
      shouldAutoRunRef.current = false;
    },
    [updateSettings],
  );

  const handleCorrect = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    try {
      await runCorrection(trimmed, selectedModel);
      lastAutoRunKey.current = generateCacheKey(selectedModel, trimmed);
      shouldAutoRunRef.current = false;
      const cached = await WebLLMProvider.isModelCached(selectedModel);
      setIsModelCached(cached);
    } catch {
      // Error handled by useAI
    }
  }, [text, selectedModel, isBusy, runCorrection]);

  const handlePrefetch = useCallback(async () => {
    setIsPrefetching(true);
    setLocalMessage(null);
    try {
      const provider = ProviderFactory.createProvider(selectedModel);
      await provider.ensureReady();
      setLocalMessage('Model synchronised');
      const cached = await WebLLMProvider.isModelCached(selectedModel);
      setIsModelCached(cached);
    } catch (err: any) {
      setLocalMessage(err.message || 'Synchronisation failed');
    } finally {
      setIsPrefetching(false);
    }
  }, [selectedModel]);

  const handleRemoveModel = useCallback(async () => {
    if (!window.confirm('Remove this model from local disk?')) return;
    setIsRemovingModel(true);
    try {
      await WebLLMProvider.deleteModel(selectedModel);
      setLocalMessage('Model removed');
      setIsModelCached(false);
      reset();
    } catch (err: any) {
      setLocalMessage(err.message || 'Removal failed');
    } finally {
      setIsRemovingModel(false);
    }
  }, [selectedModel, reset]);

  const handleClearCache = useCallback(async () => {
    if (!window.confirm('This will delete ALL downloaded models. Continue?')) return;
    setIsDeleting(true);
    try {
      await WebLLMProvider.clearCache();
      setLocalMessage('Cache cleared');
      setIsModelCached(false);
      reset();
    } catch (err: any) {
      setLocalMessage(err.message || 'Cache clear failed');
    } finally {
      setIsDeleting(false);
    }
  }, [reset]);

  const handleCopy = useCallback(() => {
    if (result?.corrected) {
      navigator.clipboard.writeText(result.corrected);
      setLocalMessage('Copied to clipboard');
    }
  }, [result]);

  const handleReplaceSelection = useCallback(() => {
    if (result?.corrected) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'replaceText',
            text: result.corrected,
          });
          setLocalMessage('Text replaced');
        }
      });
    }
  }, [result]);

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
        await runCorrection(trimmed, selectedModel);
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
  }, [isBusy, runCorrection, selectedModel, text]);

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
      <SidebarHeader title={UI_STRINGS.TITLE} subtitle={UI_STRINGS.SUBTITLE} isModelCached={isModelCached} />

      <main className='flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth'>
        <ModelSection
          title={UI_STRINGS.MODEL_SECTION}
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

        <TextSection
          title={UI_STRINGS.TEXT_SECTION}
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
          placeholder={UI_STRINGS.TEXT_PLACEHOLDER}
          emptyHint={UI_STRINGS.EMPTY_TEXT_HINT}
        />

        <ResultSection
          title={UI_STRINGS.RESULT_SECTION}
          reasoningLabel={UI_STRINGS.REASONING_LABEL}
          result={result}
          onCopy={handleCopy}
          onReplace={handleReplaceSelection}
          showDebug={showDebug}
          onToggleDebug={() => setShowDebug(!showDebug)}
          onClearCache={handleClearCache}
          localMessage={localMessage}
          error={error}
          step={step}
          isBusy={isBusy}
        />
      </main>
    </div>
  );
};

const SidePanel: React.FC = () => (
  <ErrorBoundary>
    <SidePanelContent />
  </ErrorBoundary>
);

export default SidePanel;
