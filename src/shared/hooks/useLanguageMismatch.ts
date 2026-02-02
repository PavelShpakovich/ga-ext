import { useState, useEffect, useRef, useCallback } from 'react';
import { detectDominantLanguage } from '@/shared/utils/helpers';
import { Language } from '@/shared/types';

/**
 * Hook for managing language mismatch detection and confirmation.
 * Detects when the input text language differs from the target correction language.
 *
 * @param text - The input text to analyze
 * @param correctionLanguage - The target language for correction
 * @returns Language mismatch state and control functions
 */
export function useLanguageMismatch(text: string, correctionLanguage: Language) {
  const [mismatchDetected, setMismatchDetected] = useState<Language | null>(null);
  const confirmedLanguageRef = useRef<Language | null>(null);

  // Detect language mismatch when text or target language changes
  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setMismatchDetected(null);
      confirmedLanguageRef.current = null;
      return;
    }

    const detected = detectDominantLanguage(trimmed);
    if (detected && detected !== correctionLanguage && confirmedLanguageRef.current !== detected) {
      setMismatchDetected(detected);
    } else {
      setMismatchDetected(null);
    }
  }, [correctionLanguage, text]);

  // Clear mismatch warning when target language changes
  useEffect(() => {
    confirmedLanguageRef.current = null;
    if (mismatchDetected && mismatchDetected === correctionLanguage) {
      setMismatchDetected(null);
    }
  }, [correctionLanguage, mismatchDetected]);

  /**
   * Clears the language mismatch state and confirmation
   */
  const clearMismatch = useCallback(() => {
    setMismatchDetected(null);
    confirmedLanguageRef.current = null;
  }, []);

  /**
   * Confirms the detected language (user chooses to ignore the mismatch)
   */
  const confirmDetectedLanguage = useCallback(() => {
    if (mismatchDetected) {
      confirmedLanguageRef.current = mismatchDetected;
    }
    setMismatchDetected(null);
  }, [mismatchDetected]);

  /**
   * Checks if there's a language mismatch that needs user attention
   * @param targetLanguage - The language to check against (may differ from settings)
   * @returns true if mismatch exists and hasn't been confirmed
   */
  const hasPendingMismatch = useCallback(
    (targetLanguage: Language) => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      const detected = detectDominantLanguage(trimmed);
      return !!(detected && detected !== targetLanguage && confirmedLanguageRef.current !== detected);
    },
    [text],
  );

  return {
    mismatchDetected,
    confirmedLanguageRef,
    clearMismatch,
    confirmDetectedLanguage,
    hasPendingMismatch,
  };
}
