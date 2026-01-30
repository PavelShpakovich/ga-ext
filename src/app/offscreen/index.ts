import { createWorker } from 'tesseract.js';
import { OCR_ASSETS_PATH, OCR_LANGUAGE } from '@/core/constants';
import { Logger } from '@/core/services/Logger';

let worker: any = null;

const resolveBaseUrl = (): string => {
  return chrome.runtime.getURL(OCR_ASSETS_PATH).replace(/\/+$/, '');
};

async function getWorker() {
  if (worker) return worker;

  const base = resolveBaseUrl();
  Logger.info('Offscreen', 'Initializing persistent Tesseract worker', { base });

  try {
    worker = await createWorker(OCR_LANGUAGE, 1, {
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
        const w = await getWorker();
        Logger.info('Offscreen', 'Starting OCR recognition');
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
