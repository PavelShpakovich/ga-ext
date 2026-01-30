import { createWorker } from 'tesseract.js';
import { OCR_ASSETS_PATH, LANGUAGE_CONFIG } from '@/core/constants';
import { Language } from '@/shared/types';
import { Logger } from '@/core/services/Logger';

let worker: any = null;
let currentLanguage: Language = Language.EN;

const resolveBaseUrl = (): string => {
  return chrome.runtime.getURL(OCR_ASSETS_PATH).replace(/\/+$/, '');
};

async function getWorker(language: Language = Language.EN) {
  // If language changed, create a new worker
  if (worker && currentLanguage === language) {
    return worker;
  }

  // Terminate old worker if language changed
  if (worker && currentLanguage !== language) {
    try {
      await worker.terminate();
      worker = null;
    } catch (err) {
      Logger.warn('Offscreen', 'Failed to terminate old worker', err);
    }
  }

  const tesseractCode = LANGUAGE_CONFIG[language].tesseractCode;
  const base = resolveBaseUrl();
  Logger.info('Offscreen', 'Initializing Tesseract worker', { language, tesseractCode, base });

  try {
    worker = await createWorker(tesseractCode, 1, {
      workerBlobURL: false,
      workerPath: `${base}/worker.min.js`,
      corePath: `${base}/tesseract-core.wasm.js`,
      wasmPath: `${base}/tesseract-core.wasm`,
      langPath: `${base}/tessdata`,
      cacheMethod: 'none',
      gzip: false,
      logger: (m: any) => {
        // Broadcast progress updates via runtime messages
        chrome.runtime
          .sendMessage({
            action: 'ocr-progress',
            payload: { status: m.status, progress: m.progress ?? 0 },
          })
          .catch(() => {
            // Ignore errors if nobody is listening
          });
      },
    } as any);
    
    currentLanguage = language;
  } catch (err) {
    Logger.error('Offscreen', 'Failed to create Tesseract worker', err);
    throw err;
  }

  return worker;
}

// Global message listener for OCR tasks
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'ocr' && message.image) {
    (async () => {
      try {
        const language = message.language || Language.EN;
        const w = await getWorker(language);
        Logger.info('Offscreen', 'Starting OCR recognition', { language });
        const {
          data: { text },
        } = await w.recognize(message.image);
        Logger.info('Offscreen', 'OCR recognition complete');
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
