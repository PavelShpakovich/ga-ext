/**
 * @module TesseractWorker
 * Manages the lifecycle of Tesseract.js OCR worker instance with automatic cleanup.
 * Implements language switching and idle timeout to free resources when not in use.
 */

import { createWorker, type Worker, type LoggerMessage } from 'tesseract.js';
import { OCR_ASSETS_PATH, LANGUAGE_CONFIG, OCR_IDLE_TIMEOUT_MS } from '@/core/constants';
import { Language, MessageAction } from '@/shared/types';
import { Logger } from '@/core/services/Logger';

type WorkerState = {
  instance: Worker | null;
  language: Language;
  idleTimeout: ReturnType<typeof setTimeout> | null;
};

const state: WorkerState = {
  instance: null,
  language: Language.EN,
  idleTimeout: null,
};

/**
 * Resolve base URL for Tesseract assets
 */
const resolveBaseUrl = (): string => {
  return chrome.runtime.getURL(OCR_ASSETS_PATH).replace(/\/+$/, '');
};

/**
 * Terminate the worker and clean up resources
 */
async function terminateWorker(): Promise<void> {
  if (state.instance) {
    try {
      Logger.debug('TesseractWorker', `Terminating worker for ${state.language} due to inactivity`);
      await state.instance.terminate();
      state.instance = null;
    } catch (err) {
      Logger.warn('TesseractWorker', 'Failed to terminate worker', err);
    }
  }
}

/**
 * Reset idle timeout to prevent premature worker termination
 */
function resetIdleTimeout(): void {
  if (state.idleTimeout) {
    clearTimeout(state.idleTimeout);
  }
  state.idleTimeout = setTimeout(terminateWorker, OCR_IDLE_TIMEOUT_MS);
}

/**
 * Get or create Tesseract worker for specified language.
 * Automatically manages worker lifecycle and switches languages as needed.
 * @param language - Target language for OCR recognition
 * @returns Configured Tesseract worker instance
 */
export async function getWorker(language: Language = Language.EN): Promise<Worker> {
  // Reset timeout on every use
  resetIdleTimeout();

  // Return existing worker if language matches
  if (state.instance && state.language === language) {
    return state.instance;
  }

  // Terminate old worker if language changed
  if (state.instance && state.language !== language) {
    try {
      Logger.debug('TesseractWorker', `Terminating worker for ${state.language}`);
      await state.instance.terminate();
      state.instance = null;
    } catch (err) {
      Logger.warn('TesseractWorker', 'Failed to terminate old worker', err);
    }
  }

  const tesseractCode = LANGUAGE_CONFIG[language].tesseractCode;
  const base = resolveBaseUrl();
  Logger.info('TesseractWorker', 'Initializing worker', {
    language,
    tesseractCode,
    base,
    langPath: `${base}/tessdata`,
  });

  try {
    type WorkerOptions = Parameters<typeof createWorker>[2] & { wasmPath?: string };

    const workerOptions: WorkerOptions = {
      workerBlobURL: false,
      workerPath: `${base}/worker.min.js`,
      corePath: `${base}/tesseract-core.wasm.js`,
      wasmPath: `${base}/tesseract-core.wasm`,
      langPath: `${base}/tessdata`,
      cacheMethod: 'none',
      gzip: false,
      logger: (m: LoggerMessage) => {
        // Broadcast progress updates via runtime messages
        if (m.status === 'recognizing text') {
          chrome.runtime
            .sendMessage({
              action: MessageAction.OCR_PROGRESS,
              payload: { status: 'Recognizing...', progress: m.progress ?? 0 },
            })
            .catch(() => {});
        }
      },
    };

    state.instance = await createWorker(tesseractCode, 1, workerOptions);
    state.language = language;
    Logger.info('TesseractWorker', 'Worker ready', { language });
  } catch (err) {
    Logger.error('TesseractWorker', 'Failed to create worker', err);
    throw err;
  }

  return state.instance;
}

/**
 * Recognize text from image using configured worker.
 * Creates or reuses worker instance for the specified language.
 * @param image - Base64-encoded image data or image URL
 * @param language - Target language for OCR recognition
 * @returns Recognized text content
 */
export async function recognizeText(image: string, language: Language): Promise<string> {
  const worker = await getWorker(language);
  Logger.info('TesseractWorker', 'Starting OCR recognition', { language });
  const {
    data: { text },
  } = await worker.recognize(image);
  Logger.info('TesseractWorker', 'OCR recognition complete');
  return text;
}
