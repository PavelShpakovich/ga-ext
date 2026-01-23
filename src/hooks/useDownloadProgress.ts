import { useState, useEffect, useRef } from 'react';
import { WebLLMProvider } from '../providers/WebLLMProvider';

interface DownloadProgress {
  text: string;
  progress: number;
  isDownloading: boolean;
}

export const useDownloadProgress = () => {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Set up the progress callback
    WebLLMProvider.onProgressUpdate = (progress) => {
      const isDownloading = progress.state === 'downloading';

      // If we are seeing "downloading" state, we debounce it to prevent flashing
      // caused by transient initial states (e.g. checking cache)
      if (isDownloading) {
        // If we are already showing UI, update immediately
        setDownloadProgress((current) => {
          if (current) {
            return {
              text: progress.text,
              progress: progress.progress,
              isDownloading: true,
            };
          }

          // Only start timer if not already running
          if (!downloadTimerRef.current) {
            // Store the initial progress data to use when timer fires
            // We use a self-invoking function inside setTimeout to capture current progress
            const pendingProgress = {
              text: progress.text,
              progress: progress.progress,
              isDownloading: true,
            };

            downloadTimerRef.current = setTimeout(() => {
              setDownloadProgress(pendingProgress);
              downloadTimerRef.current = null;
            }, 300);
          }
          return null;
        });
      } else {
        // If state is 'loading' (warming up), show immediately and clear any download timer
        if (downloadTimerRef.current) {
          clearTimeout(downloadTimerRef.current);
          downloadTimerRef.current = null;
        }

        setDownloadProgress({
          text: progress.text,
          progress: progress.progress,
          isDownloading: false,
        });
      }

      // Clear progress when complete
      if (progress.progress >= 1) {
        if (downloadTimerRef.current) {
          clearTimeout(downloadTimerRef.current);
          downloadTimerRef.current = null;
        }
        setTimeout(() => {
          setDownloadProgress(null);
        }, 1000);
      }
    };

    return () => {
      WebLLMProvider.onProgressUpdate = null;
      if (downloadTimerRef.current) {
        clearTimeout(downloadTimerRef.current);
      }
    };
  }, []);

  const stopDownload = () => {
    const stopped = WebLLMProvider.stopCurrentDownload();
    if (stopped) {
      setDownloadProgress(null);
    }
  };

  return { downloadProgress, stopDownload };
};
