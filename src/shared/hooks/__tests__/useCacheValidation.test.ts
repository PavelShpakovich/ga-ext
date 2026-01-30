import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCacheValidation } from '../useCacheValidation';
import { Language, Settings, CorrectionStyle } from '@/shared/types';

describe('useCacheValidation', () => {
  const mockSettings: Settings = {
    correctionLanguage: Language.EN,
    selectedModel: 'test-model',
    selectedStyle: CorrectionStyle.FORMAL,
    language: Language.EN,
  };

  const mockText = 'Hello world, this is a test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct effective language from settings', () => {
    const confirmedLanguageRef = { current: null };
    const { result } = renderHook(() => useCacheValidation(mockText, 'model-id', mockSettings, confirmedLanguageRef));

    expect(result.current.effectiveLanguage).toBe(Language.EN);
    expect(result.current.hasLanguageOverride).toBe(false);
  });

  it('should prioritize confirmed language override over settings', () => {
    const confirmedLanguageRef = { current: Language.RU };
    const { result } = renderHook(() => useCacheValidation(mockText, 'model-id', mockSettings, confirmedLanguageRef));

    expect(result.current.effectiveLanguage).toBe(Language.RU);
    expect(result.current.hasLanguageOverride).toBe(true);
  });

  it('should detect language mismatch for Cyrillic text with EN settings', () => {
    const russianText = 'Привет мир, это тест';
    const confirmedLanguageRef = { current: null };

    const { result } = renderHook(() =>
      useCacheValidation(russianText, 'model-id', mockSettings, confirmedLanguageRef),
    );

    expect(result.current.mismatchDetected).toBe(Language.RU);
  });

  it('should not detect mismatch when confirmed language matches detected language', () => {
    const russianText = 'Привет мир, это тест';
    const confirmedLanguageRef = { current: Language.RU };

    const { result } = renderHook(() =>
      useCacheValidation(russianText, 'model-id', mockSettings, confirmedLanguageRef),
    );

    expect(result.current.mismatchDetected).toBeNull();
  });

  it('should not detect mismatch for empty text', () => {
    const confirmedLanguageRef = { current: null };

    const { result } = renderHook(() => useCacheValidation('', 'model-id', mockSettings, confirmedLanguageRef));

    expect(result.current.mismatchDetected).toBeNull();
  });

  it('should not detect mismatch when detected language matches settings', () => {
    const englishText = 'This is a test in English';
    const confirmedLanguageRef = { current: null };

    const { result } = renderHook(() =>
      useCacheValidation(englishText, 'model-id', mockSettings, confirmedLanguageRef),
    );

    expect(result.current.mismatchDetected).toBeNull();
  });

  it('should generate cache key with model, style, language, and text', () => {
    const confirmedLanguageRef = { current: null };
    const { result } = renderHook(() => useCacheValidation(mockText, 'gpt-4', mockSettings, confirmedLanguageRef));

    const cacheKey = result.current.cacheKey;
    expect(cacheKey).toContain('gpt-4');
    expect(cacheKey).toContain('formal');
    expect(cacheKey).toContain(Language.EN);
    expect(cacheKey).toContain(mockText.trim());
  });

  it('should generate different cache key when style changes', () => {
    const confirmedLanguageRef = { current: null };
    const { result: result1 } = renderHook(() =>
      useCacheValidation(mockText, 'gpt-4', mockSettings, confirmedLanguageRef),
    );

    const settings2 = { ...mockSettings, selectedStyle: CorrectionStyle.CASUAL };
    const { result: result2 } = renderHook(() =>
      useCacheValidation(mockText, 'gpt-4', settings2, confirmedLanguageRef),
    );

    expect(result1.current.cacheKey).not.toBe(result2.current.cacheKey);
  });

  it('should generate different cache key when language changes', () => {
    const confirmedLanguageRef = { current: null };
    const { result: result1 } = renderHook(() =>
      useCacheValidation(mockText, 'gpt-4', mockSettings, confirmedLanguageRef),
    );

    const confirmedLanguageRef2 = { current: Language.RU };
    const { result: result2 } = renderHook(() =>
      useCacheValidation(mockText, 'gpt-4', mockSettings, confirmedLanguageRef2),
    );

    expect(result1.current.cacheKey).not.toBe(result2.current.cacheKey);
  });

  it('should generate different cache key for different text', () => {
    const confirmedLanguageRef = { current: null };
    const { result: result1 } = renderHook(() =>
      useCacheValidation('Hello', 'gpt-4', mockSettings, confirmedLanguageRef),
    );

    const { result: result2 } = renderHook(() =>
      useCacheValidation('World', 'gpt-4', mockSettings, confirmedLanguageRef),
    );

    expect(result1.current.cacheKey).not.toBe(result2.current.cacheKey);
  });

  it('should detect mismatch for Spanish text with EN settings', () => {
    const spanishText = 'el gato esta en la mesa';
    const confirmedLanguageRef = { current: null };

    const { result } = renderHook(() =>
      useCacheValidation(spanishText, 'model-id', mockSettings, confirmedLanguageRef),
    );

    expect(result.current.mismatchDetected).toBe(Language.ES);
  });

  it('should not detect mismatch with only whitespace and symbols', () => {
    const confirmedLanguageRef = { current: null };

    const { result } = renderHook(() =>
      useCacheValidation('   !!! ???   ', 'model-id', mockSettings, confirmedLanguageRef),
    );

    expect(result.current.mismatchDetected).toBeNull();
  });

  it('should maintain effective language when ref is passed', () => {
    const confirmedLanguageRef = { current: null };
    const { result } = renderHook(() => useCacheValidation(mockText, 'model-id', mockSettings, confirmedLanguageRef));

    // Initial state: no override, uses settings
    expect(result.current.effectiveLanguage).toBe(Language.EN);
    expect(result.current.hasLanguageOverride).toBe(false);

    // Note: useMemo dependencies use the ref object itself, not ref.current
    // To test language changes, we would need to pass a new ref object
    const confirmedLanguageRef2 = { current: Language.FR };
    const { result: result2 } = renderHook(() =>
      useCacheValidation(mockText, 'model-id', mockSettings, confirmedLanguageRef2),
    );

    expect(result2.current.effectiveLanguage).toBe(Language.FR);
    expect(result2.current.hasLanguageOverride).toBe(true);
  });
});
