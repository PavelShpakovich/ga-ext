import { useState, useEffect, useCallback } from 'react';
import { WebLLMProvider } from '@/core/providers/WebLLMProvider';
import { ModelProgress } from '@/shared/types';

export const useDownloadProgress = () => {
  const [downloadProgress, setDownloadProgress] = useState<ModelProgress | null>(null);

  useEffect(() => {
    WebLLMProvider.onProgressUpdate = (progress) => {
      setDownloadProgress(progress);

      if (progress.progress >= 1) {
        setTimeout(() => setDownloadProgress(null), 750);
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
