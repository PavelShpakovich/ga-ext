import { Logger } from '@/core/services/Logger';

export const isWebGPUAvailable = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch (error) {
    Logger.error('GPUUtils', 'WebGPU check failed', error);
    return false;
  }
};

export const generateCacheKey = (modelId: string, text: string): string => {
  return `${modelId}::${text.trim()}`;
};

export const normalizeDownloadProgress = (progress: number): number => {
  return Math.max(0, Math.min(1, progress));
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
