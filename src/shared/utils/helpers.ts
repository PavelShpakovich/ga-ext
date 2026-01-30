import { Logger } from '@/core/services/Logger';
import { OCR_ASSETS_PATH } from '@/core/constants';

export const isWebGPUAvailable = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;
  try {
    const navWithGpu = navigator as Navigator & { gpu: GPU };
    const adapter = await navWithGpu.gpu.requestAdapter();
    return adapter !== null;
  } catch (error) {
    Logger.error('GPUUtils', 'WebGPU check failed', error);
    return false;
  }
};

export const generateCacheKey = (modelId: string, text: string, style?: string): string =>
  style ? `${modelId}::${style}::${text.trim()}` : `${modelId}::${text.trim()}`;

export const normalizeDownloadProgress = (progress: number): number => Math.max(0, Math.min(1, progress));

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const capitalize = (s: string) => (s && s[0].toUpperCase() + s.slice(1)) || s;

export interface OCRProgress {
  status: string;
  progress: number;
}

type AssetPaths = {
  baseUrl: string;
  workerPath: string;
  corePath: string;
  wasmPath: string;
  langPath: string;
  trainedDataUrl: string;
};

const resolveBaseUrl = (): string => {
  const maybe =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL(OCR_ASSETS_PATH) : OCR_ASSETS_PATH;
  return String(maybe).replace(/\/+$/, '') || OCR_ASSETS_PATH;
};

const buildAssetPaths = (base: string): AssetPaths => {
  const workerPath = `${base}/worker.min.js`;
  const corePath = `${base}/tesseract-core.wasm.js`;
  const wasmPath = `${base}/tesseract-core.wasm`;
  const langPath = `${base}/tessdata`;
  const trainedDataUrl = `${langPath}/eng.traineddata`;
  return { baseUrl: base, workerPath, corePath, wasmPath, langPath, trainedDataUrl };
};

const preflightAssets = async (paths: AssetPaths): Promise<void> => {
  if (typeof fetch !== 'function' || !String(paths.baseUrl).includes('://')) {
    Logger.info('OCR', 'Preflight checks skipped', { baseUrl: paths.baseUrl });
    return;
  }

  const check = async (url: string) => {
    try {
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      Logger.info('OCR', `Preflight OK for ${url}`, {
        status: resp.status,
        contentLength: resp.headers.get('content-length') || 'unknown',
      });
    } catch (err) {
      Logger.error('OCR', `Preflight failed for ${url}`, err);
      throw new Error(`Failed to fetch resource at ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  await check(paths.corePath);
  await check(paths.wasmPath);
  await check(paths.trainedDataUrl);
};

const createTesseractWorker = async (_paths: AssetPaths, _onProgress?: (m: OCRProgress) => void) => {
  throw new Error('OCR processing has moved to offscreen document. Use useOCR hook instead.');
};

const recognizeImageWithWorker = async (worker: any, source: File | string): Promise<string> => {
  const {
    data: { text },
  } = await worker.recognize(source);
  return text.trim();
};

export const extractTextFromImage = async (
  imageSource: File | string,
  onProgress?: (progress: OCRProgress) => void,
): Promise<string> => {
  const base = resolveBaseUrl();
  const paths = buildAssetPaths(base);
  Logger.info('OCR', 'Resolved Tesseract paths', paths);

  let worker: any = null;
  try {
    await preflightAssets(paths);
    worker = await createTesseractWorker(paths, onProgress);
    const text = await recognizeImageWithWorker(worker, imageSource);
    return text;
  } catch (err: any) {
    const message = capitalize(String(err?.message ?? ''));
    Logger.error('OCR', 'OCR pipeline failed', { message, original: err });
    throw new Error('Failed to extract text from image. ');
  } finally {
    if (worker && typeof worker.terminate === 'function') {
      try {
        await worker.terminate();
      } catch (tErr) {
        Logger.error('OCR', 'Failed to terminate worker', tErr);
      }
    }
  }
};
