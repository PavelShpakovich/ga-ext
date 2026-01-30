import { Logger } from '@/core/services/Logger';
import { Language } from '@/shared/types';

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

export const generateCacheKey = (modelId: string, text: string, style?: string, language?: string): string => {
  const base = style ? `${modelId}::${style}` : modelId;
  const withLang = language ? `${base}::${language}` : base;
  return `${withLang}::${text.trim()}`;
};

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

/**
 * Detects the dominant script and potential language in the text to identify potential language mismatches.
 * Returns Language if a high-confidence match is found, or null otherwise.
 */
export const detectDominantLanguage = (text: string): Language | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Script-based detection (high confidence for non-Latin)
  const cyrillicCount = (trimmed.match(/[\u0400-\u04FF]/g) || []).length;
  const latinCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const totalLetters = cyrillicCount + latinCount;

  if (totalLetters < 5) return null;

  if (cyrillicCount > totalLetters * 0.4) return Language.RU;

  // 2. Stop-word based detection for Latin languages (EN, ES, DE, FR)
  if (latinCount > totalLetters * 0.6) {
    const lowerText = ` ${trimmed.toLowerCase()} `;

    const stopWords: Record<Language, string[]> = {
      [Language.EN]: [' the ', ' and ', ' with ', ' that '],
      [Language.ES]: [' el ', ' la ', ' que ', ' con '],
      [Language.DE]: [' der ', ' die ', ' das ', ' und ', ' ist '],
      [Language.FR]: [' le ', ' la ', ' les ', ' dans ', ' est '],
      [Language.RU]: [], // Handled by script
    };

    let bestLang: Language | null = null;
    let maxHits = 0;

    (Object.entries(stopWords) as [Language, string[]][]).forEach(([lang, words]) => {
      let hits = 0;
      words.forEach((word) => {
        if (lowerText.includes(word)) hits++;
      });
      if (hits > maxHits) {
        maxHits = hits;
        bestLang = lang;
      }
    });

    // Only return if we have some hits, otherwise default to EN (most common) or null
    if (maxHits > 0) return bestLang;
    return Language.EN;
  }

  return null;
};
