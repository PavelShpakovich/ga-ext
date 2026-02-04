import { Logger } from '@/core/services/Logger';
import { Language } from '@/shared/types';

/**
 * Checks if WebGPU is available in the current browser environment.
 * WebGPU is required for running WebLLM models locally with hardware acceleration.
 * @returns Promise resolving to true if WebGPU is supported and an adapter can be obtained
 */
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

/**
 * Generates a unique cache key for correction results based on model, text, style, and language.
 * Used to determine if a correction can be reused or needs to be regenerated.
 * @param modelId - The AI model identifier
 * @param text - The input text to correct
 * @param style - Optional correction style (formal, casual, etc.)
 * @param language - Optional target language
 * @returns A unique string key combining all parameters
 */
export const generateCacheKey = (modelId: string, text: string, style?: string, language?: string): string => {
  const base = style ? `${modelId}::${style}` : modelId;
  const withLang = language ? `${base}::${language}` : base;
  return `${withLang}::${text.trim()}`;
};

/**
 * Normalizes a download progress value to ensure it stays within valid bounds [0, 1].
 * @param progress - The raw progress value (may be outside 0-1 range)
 * @returns Progress value clamped between 0 and 1
 */
export const normalizeDownloadProgress = (progress: number): number => Math.max(0, Math.min(1, progress));

/**
 * Copies text to the system clipboard using the Clipboard API.
 * @param text - The text to copy
 * @returns Promise resolving to true if successful, false if the operation failed
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Capitalizes the first character of a string.
 * @param s - The input string
 * @returns String with first character uppercased, or original string if empty
 */
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

/**
 * Checks if a value is non-empty (has actual content).
 * Handles arrays, strings, objects, Maps, and Sets.
 * @param value - The value to check
 * @returns True if value has content: non-empty array, non-whitespace string, object with keys, non-empty Map/Set
 */
export const isNonEmpty = (value: unknown): boolean => {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (value instanceof Map || value instanceof Set) return value.size > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
};
