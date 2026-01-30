import { useState, useCallback, useEffect } from 'react';
import { OCRProgress } from '@/shared/utils/helpers';
import { Logger } from '@/core/services/Logger';
import { useTranslation } from 'react-i18next';

export const useOCR = () => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listen for progress updates from offscreen
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'ocr-progress') {
        setProgress(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const processImage = useCallback(
    async (imageSource: File | string): Promise<string | null> => {
      setIsProcessing(true);
      setError(null);
      setProgress({ status: t('ocr.initializing'), progress: 0 });

      try {
        let imageData = imageSource;

        // If it's a File object, we need to convert to data URL for stable cross-process transmission
        if (imageSource instanceof File) {
          imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageSource);
          });
        }

        const response = await chrome.runtime.sendMessage({
          action: 'run-ocr',
          image: imageData,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        const text = response.text;

        if (!text) {
          setError(t('ocr.no_text_found'));
          return null;
        }

        Logger.info('OCR', `Extracted ${text.length} characters from image`);
        return text;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('ocr.processing_failed');
        setError(errorMessage);
        Logger.error('useOCR', 'OCR processing failed', err);
        return null;
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [t],
  );

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setError(null);
  }, []);

  return {
    processImage,
    isProcessing,
    progress,
    error,
    reset,
  };
};
