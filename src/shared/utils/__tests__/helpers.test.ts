import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectDominantLanguage } from '../helpers';
import { Language } from '../../types';

describe('Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectDominantLanguage', () => {
    it('should detect Cyrillic as Russian', () => {
      expect(detectDominantLanguage('Привет мир')).toBe(Language.RU);
    });

    it('should detect Latin as English', () => {
      expect(detectDominantLanguage('Hello world')).toBe(Language.EN);
    });

    it('should distinguish between Latin languages using stop words', () => {
      expect(detectDominantLanguage('el gato esta en la mesa')).toBe(Language.ES);
      expect(detectDominantLanguage('le chat est dans la salle')).toBe(Language.FR);
      expect(detectDominantLanguage('der hund ist unter dem tisch')).toBe(Language.DE);
      expect(detectDominantLanguage('the dog is under the table')).toBe(Language.EN);
    });

    it('should prioritize the language with more characters', () => {
      // 2 English chars, 5 Russian chars
      expect(detectDominantLanguage('Hi Привет')).toBe(Language.RU);
      // 5 English chars, 2 Russian chars
      expect(detectDominantLanguage('Hello Пр')).toBe(Language.EN);
    });

    it('should return null for empty text', () => {
      expect(detectDominantLanguage('')).toBeNull();
    });

    it('should ignore numbers and symbols', () => {
      expect(detectDominantLanguage('123 !!! ???')).toBeNull();
    });
  });
});
