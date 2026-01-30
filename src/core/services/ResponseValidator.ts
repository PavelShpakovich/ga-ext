import { Logger } from '@/core/services/Logger';

export interface ParseErrorCategory {
  type: 'missing_field' | 'invalid_type' | 'malformed_json' | 'schema_mismatch' | 'unknown';
  severity: 'critical' | 'warning' | 'info';
  field?: string;
  details: string;
}

export interface ValidationResult {
  isValid: boolean;
  parsed: Record<string, unknown> | null;
  errorCategory?: ParseErrorCategory;
  recoveryAttempt?: string;
}

/**
 * ResponseValidator handles JSON parsing and validation with enhanced error categorization
 * and multiple recovery strategies for LLM responses.
 */
export class ResponseValidator {
  /**
   * Validates response structure against correction result schema
   */
  static validate(raw: string, _original: string): ValidationResult {
    try {
      // Strategy 1: Direct JSON parse
      const directParsed = this.tryDirectParse(raw);
      if (directParsed.isValid && directParsed.parsed) {
        return { isValid: true, parsed: directParsed.parsed };
      }

      // Strategy 2: Fix common JSON formatting issues
      const fixedParsed = this.tryFixedParse(raw);
      if (fixedParsed.isValid && fixedParsed.parsed) {
        return {
          isValid: true,
          parsed: fixedParsed.parsed,
          recoveryAttempt: 'json_repair',
        };
      }

      // Strategy 3: Extract from markdown code blocks
      const blockExtracted = this.tryExtractFromCodeBlock(raw);
      if (blockExtracted.isValid && blockExtracted.parsed) {
        return {
          isValid: true,
          parsed: blockExtracted.parsed,
          recoveryAttempt: 'code_block_extraction',
        };
      }

      // Strategy 4: Aggressive extraction (find first { and last })
      const aggressiveExtracted = this.tryAggressiveExtraction(raw);
      if (aggressiveExtracted.isValid && aggressiveExtracted.parsed) {
        return {
          isValid: true,
          parsed: aggressiveExtracted.parsed,
          recoveryAttempt: 'aggressive_extraction',
        };
      }

      // Strategy 5: Field-by-field extraction (no JSON parsing)
      const fieldExtracted = this.tryFieldExtraction(raw);
      if (fieldExtracted.isValid && fieldExtracted.parsed) {
        return {
          isValid: true,
          parsed: fieldExtracted.parsed,
          recoveryAttempt: 'field_extraction',
        };
      }

      // All strategies failed
      const errorCategory = this.categorizeParseError(raw);
      return {
        isValid: false,
        parsed: null,
        errorCategory,
      };
    } catch (err) {
      Logger.error('ResponseValidator', 'Validation failed with exception', err);
      return {
        isValid: false,
        parsed: null,
        errorCategory: {
          type: 'unknown',
          severity: 'critical',
          details: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  /**
   * Strategy 1: Attempt direct JSON parsing
   */
  private static tryDirectParse(raw: string): ValidationResult {
    const textToParse = raw.trim();
    if (!textToParse) {
      return { isValid: false, parsed: null };
    }

    try {
      const parsed = JSON.parse(textToParse);
      if (this.hasValidStructure(parsed)) {
        const normalized = this.normalizeFields(parsed as Record<string, unknown>);
        return { isValid: true, parsed: normalized };
      }
      return {
        isValid: false,
        parsed: null,
        errorCategory: {
          type: 'schema_mismatch',
          severity: 'warning',
          details: 'JSON parsed but missing required fields',
        },
      };
    } catch {
      return { isValid: false, parsed: null };
    }
  }

  /**
   * Strategy 2: Apply common JSON repair techniques
   */
  private static tryFixedParse(raw: string): ValidationResult {
    const textToParse = raw.trim();
    if (!textToParse) {
      return { isValid: false, parsed: null };
    }

    try {
      // Repair techniques in order of application
      const fixed = textToParse
        // 1. Replace literal newlines within quotes with \n (but preserve already escaped newlines)
        .replace(/"([^"]*)"/g, (match) => {
          const inner = match.slice(1, -1);
          const escaped = inner
            .replace(/([^\\])\n/g, '$1\\n') // Newline not preceded by backslash
            .replace(/^\n/g, '\\n'); // Newline at start
          return `"${escaped}"`;
        })
        // 2. Remove trailing commas before closing braces/brackets
        .replace(/,\s*([}\]])/g, '$1')
        // 3. Fix unescaped backslashes (but preserve valid escape sequences)
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
        // 4. Handle common typos: corrected_text -> corrected, correctedText -> corrected
        .replace(/"corrected_text"/g, '"corrected"')
        .replace(/"correctedText"/g, '"corrected"')
        // 5. Handle explanation field variations
        .replace(/"explanations"/g, '"explanation"')
        .replace(/"explanation_text"/g, '"explanation"')
        // 6. Fix missing commas between objects (heuristic: quote followed by quote)
        .replace(/"\s*"([a-z])/g, '","$1');

      const parsed = JSON.parse(fixed);
      if (this.hasValidStructure(parsed)) {
        // Normalize field names to lowercase
        const normalized = this.normalizeFields(parsed);
        return { isValid: true, parsed: normalized };
      }
      return {
        isValid: false,
        parsed: null,
        errorCategory: {
          type: 'schema_mismatch',
          severity: 'warning',
          details: 'Repaired JSON parsed but missing required fields',
        },
      };
    } catch (err) {
      return { isValid: false, parsed: null };
    }
  }

  /**
   * Strategy 3: Extract JSON from markdown code blocks
   */
  private static tryExtractFromCodeBlock(raw: string): ValidationResult {
    const codeBlockPatterns = [
      /```json\s*([\s\S]*?)```/, // Explicit json tag
      /```\s*([\s\S]*?)```/, // Generic code block
      /~~~json\s*([\s\S]*?)~~~/, // Tilde fences
      /~~~\s*([\s\S]*?)~~~/, // Generic tilde block
    ];

    for (const pattern of codeBlockPatterns) {
      const match = raw.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        const result = this.tryFixedParse(extracted);
        if (result.isValid) {
          return result;
        }
      }
    }

    return { isValid: false, parsed: null };
  }

  /**
   * Strategy 4: Aggressive extraction - find first { and last }
   */
  private static tryAggressiveExtraction(raw: string): ValidationResult {
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = raw.substring(firstBrace, lastBrace + 1);
      return this.tryFixedParse(extracted);
    }

    return { isValid: false, parsed: null };
  }

  /**
   * Strategy 5: Field-by-field extraction without JSON parsing
   * Last resort for severely malformed responses
   */
  private static tryFieldExtraction(raw: string): ValidationResult {
    try {
      const result: Record<string, unknown> = {};

      // Extract "corrected" field (handle various quote styles and formats)
      const correctedMatch =
        // Double quoted field names and values
        raw.match(/"corrected[d_]*(?:text|Text)"?\s*:\s*"([^"]*(?:\\"[^"]*)*)"/) ||
        // Single quoted field names and values
        raw.match(/'corrected[d_]*(?:text|Text)'?\s*:\s*'([^']*(?:\\'[^']*)*)'/) ||
        // No quotes around field name, double quoted value
        raw.match(/corrected[d_]*(?:text|Text)?\s*:\s*"([^"]*(?:\\"[^"]*)*)"/) ||
        // Unquoted field, single quoted value
        raw.match(/corrected[d_]*(?:text|Text)?\s*:\s*'([^']*(?:\\'[^']*)*)'/) ||
        null;

      if (correctedMatch) {
        result['corrected'] = correctedMatch[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '\n');
      }

      // Extract "explanation" field (array or string)
      const explanationMatch =
        raw.match(/"explanation[s]?"?\s*:\s*\[(.*?)\]/) || raw.match(/'explanation[s]?'?\s*:\s*\[(.*?)\]/) || null;

      if (explanationMatch) {
        const items = explanationMatch[1]
          .split(',')
          .map((item) => item.trim().replace(/^["']|["']$/g, ''))
          .filter((item) => item.length > 0);
        result['explanation'] = items;
      }

      if (Object.keys(result).length > 0 && result['corrected']) {
        return { isValid: true, parsed: result };
      }

      return { isValid: false, parsed: null };
    } catch {
      return { isValid: false, parsed: null };
    }
  }

  /**
   * Checks if parsed object has the minimal valid structure
   */
  private static hasValidStructure(parsed: unknown): boolean {
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }

    const obj = parsed as Record<string, unknown>;
    const hasCorrected = 'corrected' in obj || 'corrected_text' in obj || 'correctedText' in obj;

    return hasCorrected;
  }

  /**
   * Normalizes field names to lowercase canonical forms
   */
  private static normalizeFields(parsed: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    // Normalize corrected field
    if ('corrected' in parsed) {
      normalized['corrected'] = parsed['corrected'];
    } else if ('corrected_text' in parsed) {
      normalized['corrected'] = parsed['corrected_text'];
    } else if ('correctedText' in parsed) {
      normalized['corrected'] = parsed['correctedText'];
    }

    // Normalize explanation field
    if ('explanation' in parsed) {
      normalized['explanation'] = parsed['explanation'];
    } else if ('explanations' in parsed) {
      normalized['explanation'] = parsed['explanations'];
    } else if ('explanation_text' in parsed) {
      normalized['explanation'] = parsed['explanation_text'];
    }

    // Preserve any other fields
    for (const [key, value] of Object.entries(parsed)) {
      if (
        !['corrected', 'corrected_text', 'correctedText', 'explanation', 'explanations', 'explanation_text'].includes(
          key,
        )
      ) {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Categorizes parse errors to help diagnose issues
   */
  private static categorizeParseError(raw: string): ParseErrorCategory {
    if (!raw || raw.trim().length === 0) {
      return {
        type: 'malformed_json',
        severity: 'critical',
        details: 'Empty or whitespace-only response',
      };
    }

    if (!raw.includes('{') || !raw.includes('}')) {
      return {
        type: 'malformed_json',
        severity: 'critical',
        details: 'Response does not contain JSON object braces',
      };
    }

    if (!raw.includes('corrected') && !raw.includes('corrected_text') && !raw.includes('correctedText')) {
      return {
        type: 'missing_field',
        severity: 'critical',
        field: 'corrected',
        details: 'Response missing corrected field (and variations)',
      };
    }

    if (!raw.includes('explanation')) {
      return {
        type: 'missing_field',
        severity: 'warning',
        field: 'explanation',
        details: 'Response missing explanation field',
      };
    }

    // Try to identify type errors
    const correctedMatch = raw.match(/"corrected[d_]*(?:text|Text)"?\s*:\s*([^,}]+)/);
    if (correctedMatch && !correctedMatch[1].includes('"')) {
      return {
        type: 'invalid_type',
        severity: 'warning',
        field: 'corrected',
        details: 'Corrected field value not quoted as string',
      };
    }

    return {
      type: 'unknown',
      severity: 'warning',
      details: 'Unable to parse JSON response - unknown error',
    };
  }

  /**
   * Logs error telemetry for debugging and monitoring
   */
  static logParseError(
    errorCategory: ParseErrorCategory,
    modelId: string,
    style: string,
    recoveryAttempt?: string,
  ): void {
    const telemetryData = {
      modelId,
      style,
      errorType: errorCategory.type,
      severity: errorCategory.severity,
      field: errorCategory.field,
      recoveryAttempt: recoveryAttempt || 'none',
      timestamp: new Date().toISOString(),
    };

    if (errorCategory.severity === 'critical') {
      Logger.error('ResponseValidator', 'Critical parse error', telemetryData);
    } else if (errorCategory.severity === 'warning') {
      Logger.warn('ResponseValidator', 'Parse warning (recovered)', telemetryData);
    } else {
      Logger.debug('ResponseValidator', 'Parse info', telemetryData);
    }
  }
}
