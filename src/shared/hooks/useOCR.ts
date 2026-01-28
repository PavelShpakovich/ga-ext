import { useState, useCallback } from 'react';
import { extractTextFromImage, OCRProgress } from '@/shared/utils/helpers';
import { Logger } from '@/core/services/Logger';
import { useTranslation } from 'react-i18next';

export const useOCR = () => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    async (imageSource: File | string): Promise<string | null> => {
      setIsProcessing(true);
      setError(null);
      setProgress({ status: t('ocr.initializing'), progress: 0 });

      try {
        const text = await extractTextFromImage(imageSource, (ocrProgress) => {
          setProgress(ocrProgress);
        });

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
