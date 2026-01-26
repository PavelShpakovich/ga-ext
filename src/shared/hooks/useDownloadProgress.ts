import { useState, useEffect, useCallback } from 'react';
import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { ModelProgress } from '@/shared/types';
import i18n from '@/core/i18n';

const PROGRESS_COMPLETE_DELAY_MS = 750;
const PROGRESS_FULL = 1;

export const useDownloadProgress = (): {
  downloadProgress: ModelProgress | null;
  stopDownload: () => void;
} => {
  const [downloadProgress, setDownloadProgress] = useState<ModelProgress | null>(null);

  useEffect(() => {
    WebLLMProvider.onProgressUpdate = (progress) => {
      setDownloadProgress(progress);

      // Clear after success OR after cancellation
      const isComplete = progress.progress >= PROGRESS_FULL;
      const isCancelled = progress.text === i18n.t('messages.download_cancelled');

      if (isComplete || isCancelled) {
        setTimeout(() => setDownloadProgress(null), PROGRESS_COMPLETE_DELAY_MS);
      }
    };

    return () => {
      WebLLMProvider.onProgressUpdate = null;
    };
  }, []);

  const stopDownload = useCallback(async () => {
    // Clear progress immediately to prevent UI flash
    setDownloadProgress(null);
    await WebLLMProvider.stopCurrentDownload();
  }, []);

  return { downloadProgress, stopDownload };
};
