import { useMemo } from 'react';
import { Language, Settings } from '@/shared/types';
import { generateCacheKey, detectDominantLanguage } from '@/shared/utils/helpers';

/**
 * Custom hook for cache validation and language detection
 * Consolidates cache key generation, language override logic, and mismatch detection
 * Prevents stale caches and ensures language consistency across corrections
 */
export const useCacheValidation = (
  text: string,
  modelId: string,
  settings: Settings,
  confirmedLanguageRef: { current: Language | null },
) => {
  /**
   * Determine the effective language for cache/correction
   * Prioritizes confirmed override, then falls back to settings
   */
  const effectiveLanguage = useMemo(
    () => confirmedLanguageRef.current || settings.correctionLanguage,
    [confirmedLanguageRef, settings.correctionLanguage],
  );

  /**
   * Detect language mismatch between detected and configured language
   * Only triggers if:
   * 1. Text has content
   * 2. Detected language differs from configured language
   * 3. No confirmed override exists for this text
   */
  const mismatchDetected = useMemo(() => {
    if (!text.trim()) {
      return null;
    }

    const detected = detectDominantLanguage(text);
    if (detected && detected !== settings.correctionLanguage && confirmedLanguageRef.current !== detected) {
      return detected;
    }

    return null;
  }, [text, settings.correctionLanguage, confirmedLanguageRef]);

  /**
   * Generate cache key including model, style, language, and text
   * Used to validate if result already exists in cache
   * Includes effective language to prevent cross-language cache hits
   */
  const cacheKey = useMemo(
    () => generateCacheKey(modelId, text, settings.selectedStyle, effectiveLanguage),
    [modelId, text, settings.selectedStyle, effectiveLanguage],
  );

  /**
   * Check if there's a pending language override
   * Used to determine if user has acknowledged language mismatch
   */
  const hasLanguageOverride = useMemo(() => confirmedLanguageRef.current !== null, [confirmedLanguageRef]);

  return {
    effectiveLanguage,
    mismatchDetected,
    cacheKey,
    hasLanguageOverride,
  };
};
