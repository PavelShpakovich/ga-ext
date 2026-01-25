import { useState, useEffect, useCallback } from 'react';
import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { ModelProgress } from '@/shared/types';

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

      if (progress.progress >= PROGRESS_FULL) {
        setTimeout(() => setDownloadProgress(null), PROGRESS_COMPLETE_DELAY_MS);
      }
    };

    return () => {
      WebLLMProvider.onProgressUpdate = null;
    };
  }, []);

  const stopDownload = useCallback(() => {
    WebLLMProvider.stopCurrentDownload();
    setDownloadProgress(null);
  }, []);

  return { downloadProgress, stopDownload };
};
