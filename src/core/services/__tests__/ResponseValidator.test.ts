import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseValidator } from '@/core/services/ResponseValidator';

describe('ResponseValidator', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  describe('Direct JSON Parsing', () => {
    it('should parse valid JSON with corrected field', () => {
      const raw = JSON.stringify({
        corrected: 'Fixed text',
        explanation: ['Changed spelling'],
      });

      const result = ResponseValidator.validate(raw, 'original');
      expect(result.isValid).toBe(true);
      expect(result.parsed?.corrected).toBe('Fixed text');
    });

    it('should reject empty response', () => {
      const result = ResponseValidator.validate('', 'original');
      expect(result.isValid).toBe(false);
      expect(result.errorCategory?.type).toBe('malformed_json');
    });

    it('should reject response without braces', () => {
      const result = ResponseValidator.validate('not json at all', 'original');
      expect(result.isValid).toBe(false);
      expect(result.errorCategory?.type).toBe('malformed_json');
    });
  });

  describe('JSON Repair Strategies', () => {
    it('should fix unescaped newlines in strings', () => {
      const malformed = `{
        "corrected": "Line 1
Line 2",
        "explanation": []
      }`;

      const result = ResponseValidator.validate(malformed, 'original');
      expect(result.isValid).toBe(true);
      expect(result.recoveryAttempt).toBe('json_repair');
    });

    it('should remove trailing commas', () => {
      const malformed = `{
        "corrected": "text",
        "explanation": ["fix1", "fix2"],
      }`;

      const result = ResponseValidator.validate(malformed, 'original');
      expect(result.isValid).toBe(true);
      expect(result.recoveryAttempt).toBe('json_repair');
    });

    it('should handle corrected_text field name', () => {
      const withSnakeCase = `{
        "corrected_text": "Fixed",
        "explanation": []
      }`;

      const result = ResponseValidator.validate(withSnakeCase, 'original');
      expect(result.isValid).toBe(true);
      expect(result.parsed?.corrected).toBe('Fixed');
    });

    it('should handle correctedText field name', () => {
      const withCamelCase = `{
        "correctedText": "Fixed",
        "explanation": []
      }`;

      const result = ResponseValidator.validate(withCamelCase, 'original');
      expect(result.isValid).toBe(true);
      expect(result.parsed?.corrected).toBe('Fixed');
    });

    it('should handle explanations field name variation', () => {
      const withPlural = `{
        "corrected": "text",
        "explanations": ["fix1"]
      }`;

      const result = ResponseValidator.validate(withPlural, 'original');
      expect(result.isValid).toBe(true);
      expect(result.parsed?.explanation).toBeDefined();
    });

    it('should fix unescaped backslashes', () => {
      const withBackslash = `{
        "corrected": "C:\\\\Users\\\\path",
        "explanation": []
      }`;

      const result = ResponseValidator.validate(withBackslash, 'original');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Code Block Extraction', () => {
    it('should extract JSON from markdown json code block', () => {
      const withCodeBlock = `
        Here is the result:
        \`\`\`json
        {"corrected": "Fixed", "explanation": []}
        \`\`\`
      `;

      const result = ResponseValidator.validate(withCodeBlock, 'original');
      expect(result.isValid).toBe(true);
      expect(result.recoveryAttempt).toBe('code_block_extraction');
    });

    it('should extract JSON from generic code block', () => {
      const withGenericBlock = `
        \`\`\`
        {"corrected": "Fixed", "explanation": []}
        \`\`\`
      `;

      const result = ResponseValidator.validate(withGenericBlock, 'original');
      expect(result.isValid).toBe(true);
      expect(result.recoveryAttempt).toBe('code_block_extraction');
    });

    it('should extract from tilde fences', () => {
      const withTildeFence = `
        ~~~json
        {"corrected": "Fixed", "explanation": []}
        ~~~
      `;

      const result = ResponseValidator.validate(withTildeFence, 'original');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Aggressive Extraction', () => {
    it('should extract JSON from wrapped response', () => {
      const wrapped = `
        Here is my response:
        {"corrected": "Fixed text", "explanation": ["Improved grammar"]}
        Please use this.
      `;

      const result = ResponseValidator.validate(wrapped, 'original');
      expect(result.isValid).toBe(true);
      expect(result.recoveryAttempt).toBe('aggressive_extraction');
      expect(result.parsed?.corrected).toBe('Fixed text');
    });

    it('should handle nested JSON in response', () => {
      const nested = `
        Output: {"corrected": "text", "explanation": [], "metadata": {"lang": "en"}}
      `;

      const result = ResponseValidator.validate(nested, 'original');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Field Extraction Fallback', () => {
    it('should extract fields from severely malformed JSON', () => {
      const severelyMalformed = `
        corrected: "Fixed text"
        explanation: ["fix1", "fix2"]
      `;

      const result = ResponseValidator.validate(severelyMalformed, 'original');
      expect(result.isValid).toBe(true);
      expect(result.recoveryAttempt).toBe('field_extraction');
      expect(result.parsed?.corrected).toBe('Fixed text');
    });

    it('should extract with single quotes', () => {
      // Some LLMs might output object literals with single quotes
      // This tests resilience to that specific error
      const singleQuoted = `
        corrected: 'Fixed text'
        explanation: ['fix1', 'fix2']
      `;

      const result = ResponseValidator.validate(singleQuoted, 'original');
      expect(result.isValid).toBe(true);
      expect(result.recoveryAttempt).toBe('field_extraction');
    });

    it('should handle missing quotes around field names', () => {
      const noFieldQuotes = `
        {
          corrected: "Text is fixed",
          explanation: ["Good change"]
        }
      `;

      const result = ResponseValidator.validate(noFieldQuotes, 'original');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize missing corrected field', () => {
      const missingCorrected = `{"explanation": ["fix"]}`;

      const result = ResponseValidator.validate(missingCorrected, 'original');
      expect(result.isValid).toBe(false);
      expect(result.errorCategory?.type).toBe('missing_field');
      expect(result.errorCategory?.field).toBe('corrected');
    });

    it('should categorize missing explanation field', () => {
      const missingExplanation = `{"corrected": "text"}`;

      const result = ResponseValidator.validate(missingExplanation, 'original');
      // Should be valid - explanation is optional
      expect(result.isValid).toBe(true);
    });

    it('should categorize malformed JSON without braces', () => {
      const noBraces = `corrected text without json`;

      const result = ResponseValidator.validate(noBraces, 'original');
      expect(result.isValid).toBe(false);
      expect(result.errorCategory?.type).toBe('malformed_json');
    });

    it('should categorize type mismatch (non-string corrected)', () => {
      const typeError = `{"corrected": 123, "explanation": []}`;

      const result = ResponseValidator.validate(typeError, 'original');
      // Should still parse but capture the issue
      expect(result.parsed).toBeDefined();
    });

    it('should categorize completely unknown errors', () => {
      const completelyBroken = `{]{{["unclosed`;

      const result = ResponseValidator.validate(completelyBroken, 'original');
      expect(result.isValid).toBe(false);
      expect(result.errorCategory?.severity).toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle markdown text with backticks', () => {
      const withMarkdown = JSON.stringify({
        corrected: 'Use `const` for variables\n\nAnd `let` for loops',
        explanation: ['Added code formatting', 'Fixed example'],
      });

      const result = ResponseValidator.validate(withMarkdown, 'original');
      expect(result.isValid).toBe(true);
      expect(result.parsed?.corrected).toContain('`const`');
    });

    it('should handle HTML entities in text', () => {
      const withEntities = JSON.stringify({
        corrected: 'This & that — both < important',
        explanation: ['Fixed punctuation'],
      });

      const result = ResponseValidator.validate(withEntities, 'original');
      expect(result.isValid).toBe(true);
    });

    it('should handle URLs in response', () => {
      const withUrls = JSON.stringify({
        corrected: 'Visit https://example.com for more info. See https://docs.example.com/api',
        explanation: ['Added reference links'],
      });

      const result = ResponseValidator.validate(withUrls, 'original');
      expect(result.isValid).toBe(true);
    });

    it('should handle special JSON characters', () => {
      const withSpecial = JSON.stringify({
        corrected: 'Quote: "hello", newline: line1\\nline2, backslash: \\\\path',
        explanation: ['Preserved escapes'],
      });

      const result = ResponseValidator.validate(withSpecial, 'original');
      expect(result.isValid).toBe(true);
    });

    it('should handle very long corrected text', () => {
      const longText = 'A'.repeat(5000);
      const withLongText = JSON.stringify({
        corrected: longText,
        explanation: ['Processed long text'],
      });

      const result = ResponseValidator.validate(withLongText, 'original');
      expect(result.isValid).toBe(true);
      expect(typeof result.parsed?.corrected).toBe('string');
      expect((result.parsed?.corrected as string).length).toBe(5000);
    });

    it('should handle user error message format from the issue', () => {
      const userExample = `{
        "corrected": "Akaram, Uday Das, Kausik, I was fixing a bug and found that the tally response structure differs between Sonic UAT and Arbys UAT.",
        "explanation": ["Fixed spacing and rewording for clarity"]
      }`;

      const result = ResponseValidator.validate(userExample, 'original');
      expect(result.isValid).toBe(true);
      expect(result.parsed?.corrected).toContain('Akaram');
    });

    it('should handle multiline explanation arrays', () => {
      const multilineExplanation = `{
        "corrected": "The structure is different",
        "explanation": [
          "Fixed capitalization at start",
          "Corrected grammar issue",
          "Improved clarity"
        ]
      }`;

      const result = ResponseValidator.validate(multilineExplanation, 'original');
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.parsed?.explanation)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', () => {
      const withNull = `{"corrected": null, "explanation": null}`;

      const result = ResponseValidator.validate(withNull, 'original');
      // Should handle but may not be valid structure
      expect(result).toBeDefined();
    });

    it('should handle empty arrays', () => {
      const emptyArray = `{"corrected": "text", "explanation": []}`;

      const result = ResponseValidator.validate(emptyArray, 'original');
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.parsed?.explanation)).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const unicode = JSON.stringify({
        corrected: '你好世界 مرحبا العالم Здравствуй мир',
        explanation: ['Preserved Unicode'],
      });

      const result = ResponseValidator.validate(unicode, 'original');
      expect(result.isValid).toBe(true);
      expect(result.parsed?.corrected).toContain('你好');
    });

    it('should handle repeated quotes and escapes', () => {
      const repeated = `{
        "corrected": "He said \\"Hello\\" and then \\"Goodbye\\"",
        "explanation": ["Fixed quotation marks"]
      }`;

      const result = ResponseValidator.validate(repeated, 'original');
      expect(result.isValid).toBe(true);
    });
  });
});
