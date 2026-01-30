import { createWorker } from 'tesseract.js';
import { OCR_ASSETS_PATH, LANGUAGE_CONFIG, OCR_IDLE_TIMEOUT_MS } from '@/core/constants';
import { Language } from '@/shared/types';
import { Logger } from '@/core/services/Logger';

let worker: any = null;
let currentLanguage: Language = Language.EN;
let idleTimeout: ReturnType<typeof setTimeout> | null = null;

const resolveBaseUrl = (): string => {
  return chrome.runtime.getURL(OCR_ASSETS_PATH).replace(/\/+$/, '');
};

async function terminateWorker() {
  if (worker) {
    try {
      Logger.debug('Offscreen', `Terminating worker for ${currentLanguage} due to inactivity`);
      await worker.terminate();
      worker = null;
    } catch (err) {
      Logger.warn('Offscreen', 'Failed to terminate worker', err);
    }
  }
}

function resetIdleTimeout() {
  if (idleTimeout) {
    clearTimeout(idleTimeout);
  }
  idleTimeout = setTimeout(terminateWorker, OCR_IDLE_TIMEOUT_MS);
}

async function getWorker(language: Language = Language.EN) {
  // Reset timeout on every use
  resetIdleTimeout();

  // If language changed, create a new worker
  if (worker && currentLanguage === language) {
    return worker;
  }

  // Terminate old worker if language changed
  if (worker && currentLanguage !== language) {
    try {
      Logger.debug('Offscreen', `Terminating worker for ${currentLanguage}`);
      await worker.terminate();
      worker = null;
    } catch (err) {
      Logger.warn('Offscreen', 'Failed to terminate old worker', err);
    }
  }

  const tesseractCode = LANGUAGE_CONFIG[language].tesseractCode;
  const base = resolveBaseUrl();
  Logger.info('Offscreen', 'Initializing Tesseract worker', {
    language,
    tesseractCode,
    base,
    langPath: `${base}/tessdata`,
  });

  try {
    // In Tesseract.js v5+, createWorker is async and manages the initialization
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
        if (m.status === 'recognizing text') {
          chrome.runtime
            .sendMessage({
              action: 'ocr-progress',
              payload: { status: 'Recognizing...', progress: m.progress ?? 0 },
            })
            .catch(() => {});
        }
      },
    } as any);

    currentLanguage = language;
    Logger.info('Offscreen', 'Tesseract worker ready', { language });
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
