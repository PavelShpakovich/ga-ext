import { useState, useEffect, useRef } from 'react';
import { WebLLMProvider } from '../providers/WebLLMProvider';

interface DownloadProgress {
  text: string;
  progress: number;
  isDownloading: boolean;
}

interface PendingProgress {
  text: string;
  progress: number;
}

export const useDownloadProgress = () => {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgressRef = useRef<PendingProgress | null>(null);

  useEffect(() => {
    // Set up the progress callback
    WebLLMProvider.onProgressUpdate = (progress) => {
      const isDownloading = progress.state === 'downloading';

      // If we are seeing "downloading" state, we debounce it to prevent flashing
      // caused by transient initial states (e.g. checking cache)
      if (isDownloading) {
        // If we are already showing UI, update immediately
        if (downloadProgress) {
          setDownloadProgress({
            text: progress.text,
            progress: progress.progress,
            isDownloading: true,
          });
        } else {
          // Store latest progress in ref for debounced update
          pendingProgressRef.current = {
            text: progress.text,
            progress: progress.progress,
          };

          // Only start timer if not already running
          if (!downloadTimerRef.current) {
            downloadTimerRef.current = setTimeout(() => {
              // Use the latest progress from ref when timer fires
              if (pendingProgressRef.current) {
                setDownloadProgress({
                  ...pendingProgressRef.current,
                  isDownloading: true,
                });
                pendingProgressRef.current = null;
              }
              downloadTimerRef.current = null;
            }, 300);
          }
        }
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
        downloadTimerRef.current = null;
      }
      pendingProgressRef.current = null;
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
