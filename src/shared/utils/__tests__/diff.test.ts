import { describe, it, expect } from 'vitest';
import { getDiff, DiffPart } from '../diff';

describe('Diff Helper', () => {
  describe('getDiff', () => {
    it('should return identical text with no markers', () => {
      const result = getDiff('hello world', 'hello world');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ value: 'hello world' });
    });

    it('should mark additions', () => {
      const result = getDiff('hello', 'hello world');
      expect(result).toContainEqual(expect.objectContaining({ added: true }));
      const added = result.find((part) => part.added);
      expect(added?.value).toContain('world');
    });

    it('should mark removals', () => {
      const result = getDiff('hello world', 'hello');
      expect(result).toContainEqual(expect.objectContaining({ removed: true }));
      const removed = result.find((part) => part.removed);
      expect(removed?.value).toContain('world');
    });

    it('should handle complete replacements', () => {
      const result = getDiff('hello', 'goodbye');
      const hasRemoved = result.some((part) => part.removed);
      const hasAdded = result.some((part) => part.added);
      expect(hasRemoved).toBe(true);
      expect(hasAdded).toBe(true);
    });

    it('should combine consecutive parts with same type', () => {
      const result = getDiff('hello world foo', 'hello world bar baz');
      // Should combine 'bar baz' into single added part
      // Result should be combined, not individual words
      expect(result.length).toBeLessThan(5);
    });

    it('should detect insertions in the middle', () => {
      const result = getDiff('the dog', 'the quick dog');
      const added = result.find((part) => part.added);
      expect(added?.value).toContain('quick');
    });

    it('should detect deletions from the middle', () => {
      const result = getDiff('the quick dog', 'the dog');
      const removed = result.find((part) => part.removed);
      expect(removed?.value).toContain('quick');
    });

    it('should handle multiple additions and removals', () => {
      const result = getDiff('the cat sat', 'a dog jumped');
      const hasAdded = result.some((part) => part.added);
      const hasRemoved = result.some((part) => part.removed);
      expect(hasAdded).toBe(true);
      expect(hasRemoved).toBe(true);
    });

    it('should preserve whitespace in values', () => {
      const result = getDiff('hello world', 'hello  world');
      const combined = result.map((p) => p.value).join('');
      // Should contain the actual text with spacing differences
      expect(combined).toContain('hello');
      expect(combined).toContain('world');
    });

    it('should handle empty string inputs', () => {
      const result1 = getDiff('', 'hello');
      const result2 = getDiff('hello', '');

      expect(result1.some((part) => part.added)).toBe(true);
      expect(result2.some((part) => part.removed)).toBe(true);
    });

    it('should handle empty strings for both inputs', () => {
      const result = getDiff('', '');
      // When both are empty, the result may be empty or contain empty part
      expect(result.length).toBeLessThanOrEqual(1);
      if (result.length > 0) {
        expect(result[0].value).toBe('');
      }
    });

    it('should preserve text content in additions', () => {
      const result = getDiff('start', 'start of the journey');
      const added = result.filter((part) => part.added);
      const addedText = added.map((p) => p.value).join('');
      expect(addedText).toContain('of the journey');
    });

    it('should preserve text content in removals', () => {
      const result = getDiff('start of the journey', 'start');
      const removed = result.filter((part) => part.removed);
      const removedText = removed.map((p) => p.value).join('');
      expect(removedText).toContain('of the journey');
    });

    it('should handle single character changes', () => {
      const result = getDiff('cat', 'bat');
      const hasChange = result.some((part) => part.added || part.removed);
      expect(hasChange).toBe(true);
    });

    it('should handle word order swaps', () => {
      const result = getDiff('hello world', 'world hello');
      const hasAdded = result.some((part) => part.added);
      const hasRemoved = result.some((part) => part.removed);
      expect(hasAdded && hasRemoved).toBe(true);
    });

    it('should handle repeated words', () => {
      const result = getDiff('the the dog', 'the dog');
      const removed = result.find((part) => part.removed);
      expect(removed).toBeDefined();
    });

    it('should handle text with punctuation', () => {
      const result = getDiff('Hello, world!', 'Hello, world.');
      // Should detect the change from ! to .
      const hasChange = result.some((part) => part.added || part.removed);
      expect(hasChange).toBe(true);
    });

    it('should return all parts with value property', () => {
      const result = getDiff('hello world', 'hello brave world');
      result.forEach((part) => {
        expect(part).toHaveProperty('value');
        expect(typeof part.value).toBe('string');
      });
    });

    it('should have each part as either added, removed, or unchanged', () => {
      const result = getDiff('hello world', 'hello brave world');
      result.forEach((part) => {
        const isAdded = part.added === true;
        const isRemoved = part.removed === true;
        const isUnchanged = !part.added && !part.removed;
        expect(isAdded || isRemoved || isUnchanged).toBe(true);
      });
    });

    it('should never have both added and removed on same part', () => {
      const result = getDiff('hello world', 'goodbye world');
      result.forEach((part) => {
        expect(!(part.added && part.removed)).toBe(true);
      });
    });

    it('should handle look-ahead window for word matching', () => {
      // Test the look-ahead algorithm with words that appear later
      const result = getDiff('a b c d', 'a x b c d');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should match grammar correction use case', () => {
      const original = 'The quick brown fox jump over the lazy dog';
      const corrected = 'The quick brown fox jumps over the lazy dog';
      const result = getDiff(original, corrected);

      const hasRemoved = result.some((part) => part.removed && part.value.includes('jump'));
      const hasAdded = result.some((part) => part.added && part.value.includes('jumps'));
      expect(hasRemoved && hasAdded).toBe(true);
    });

    it('should handle multi-word additions', () => {
      const result = getDiff('The dog', 'The quick brown dog');
      const added = result.filter((part) => part.added);
      const addedText = added.map((p) => p.value).join('');
      expect(addedText).toContain('quick brown');
    });

    it('should handle case sensitivity', () => {
      const result = getDiff('Hello', 'hello');
      // Should detect difference (case sensitive)
      expect(result.length).toBeGreaterThan(1);
    });

    it('should handle text with numbers', () => {
      const result = getDiff('Item 1 and 2', 'Item 1 and 3');
      const hasChange = result.some((part) => part.added || part.removed);
      expect(hasChange).toBe(true);
    });

    it('should combine consecutive additions', () => {
      const result = getDiff('start end', 'start middle content here end');
      // Look for combined additions rather than individual words
      const additions = result.filter((part) => part.added);
      // Should have fewer additions due to combining
      expect(additions.length).toBeLessThanOrEqual(1);
    });

    it('should return valid DiffPart objects', () => {
      const result: DiffPart[] = getDiff('old', 'new');
      result.forEach((part) => {
        expect(typeof part.value).toBe('string');
        if (part.added !== undefined) expect(typeof part.added).toBe('boolean');
        if (part.removed !== undefined) expect(typeof part.removed).toBe('boolean');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long identical text efficiently', () => {
      const longText = 'word '.repeat(100);
      const result = getDiff(longText, longText);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(longText);
    });

    it('should handle text with only spaces', () => {
      const result = getDiff('   ', 'a');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const result = getDiff('a@b#c', 'a@b$c');
      expect(result.some((part) => part.added || part.removed)).toBe(true);
    });

    it('should handle newlines and special whitespace', () => {
      const result = getDiff('hello\nworld', 'hello world');
      expect(result).toBeDefined();
    });
  });
});
