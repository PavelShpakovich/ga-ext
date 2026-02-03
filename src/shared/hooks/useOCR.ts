import { useState, useCallback, useEffect } from 'react';
import { OCRProgress } from '@/shared/utils/helpers';
import { Logger } from '@/core/services/Logger';
import { useTranslation } from 'react-i18next';
import { useSettings } from './useSettings';
import { validateImageDataUrl } from '@/shared/utils/validation';
import { MessageAction } from '@/shared/types';

export const useOCR = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  type OcrProgressMessage = { action: MessageAction.OCR_PROGRESS; payload: OCRProgress };

  // Listen for progress updates from offscreen
  useEffect(() => {
    const handleMessage = (message: unknown) => {
      const maybeMessage = message as Partial<OcrProgressMessage>;
      if (maybeMessage.action === MessageAction.OCR_PROGRESS && maybeMessage.payload) {
        setProgress(maybeMessage.payload);
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

      Logger.info('useOCR', 'Starting OCR processing', {
        sourceType: imageSource instanceof File ? 'File' : 'DataURL',
        language: settings.correctionLanguage,
      });

      try {
        let imageData = imageSource;

        // If it's a File object, we need to convert to data URL for stable cross-process transmission
        if (imageSource instanceof File) {
          Logger.debug('useOCR', 'Converting File to data URL', {
            fileName: imageSource.name,
            fileSize: imageSource.size,
            fileType: imageSource.type,
          });

          imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageSource);
          });
        }

        // Validate image data URL
        const validation = validateImageDataUrl(imageData as string);
        if (!validation.valid) {
          Logger.error('useOCR', 'Invalid image data', {
            error: validation.error,
            details: validation.details,
          });
          throw new Error(validation.details || t('ocr.invalid_image'));
        }

        const response = await chrome.runtime.sendMessage({
          action: MessageAction.RUN_OCR,
          image: imageData,
          language: settings.correctionLanguage,
        });

        if (response.error) {
          Logger.error('useOCR', 'OCR service returned error', { error: response.error });
          throw new Error(response.error);
        }

        const text = response.text;

        if (!text) {
          Logger.warn('useOCR', 'No text extracted from image');
          setError(t('ocr.no_text_found'));
          return null;
        }

        Logger.info('useOCR', 'OCR processing completed successfully', {
          extractedLength: text.length,
          language: settings.correctionLanguage,
        });
        return text;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('ocr.processing_failed');
        setError(errorMessage);
        Logger.error('useOCR', 'OCR processing failed', {
          error: err,
          language: settings.correctionLanguage,
        });
        return null;
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [t, settings.correctionLanguage],
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
