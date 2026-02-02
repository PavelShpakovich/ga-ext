import { Language } from '@/shared/types';
import { Logger } from '@/core/services/Logger';
import { recognizeText } from './tesseractWorker';

// Global message listener for OCR tasks
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'ocr' && message.image) {
    (async () => {
      try {
        const language = message.language || Language.EN;
        const text = await recognizeText(message.image, language);
        sendResponse({ text });
      } catch (error) {
        Logger.error('Offscreen', 'OCR recognition failed', error);
        sendResponse({ error: (error as Error).message || 'OCR failed' });
      }
    })();
    return true; // Keep message channel open
  }
  return false;
});

Logger.info('Offscreen', 'Offscreen document script loaded');
