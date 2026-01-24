// Abstract AI Provider Interface

import { CorrectionResult, CorrectionStyle } from '../types';

export enum ProviderStatus {
  READY = 'ready',
  LOADING = 'loading',
  ERROR = 'error',
  NOT_CONFIGURED = 'not_configured',
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export abstract class AIProvider {
  protected config: ProviderConfig;
  protected status: ProviderStatus = ProviderStatus.NOT_CONFIGURED;

  constructor(config: ProviderConfig = {}) {
    this.config = config;
  }

  /**
   * Correct the given text with the specified style
   */
  abstract correct(text: string, style: CorrectionStyle): Promise<CorrectionResult>;

  /**
   * Check if the provider is available and configured
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get the current status of the provider
   */
  getStatus(): ProviderStatus {
    return this.status;
  }

  /**
   * Update provider configuration
   */
  configure(config: ProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Build the prompt for the AI model
   */
  protected buildPrompt(text: string, style: CorrectionStyle): string {
    const styleInstructions = {
      formal:
        "Professional tone for business/academic writing. Use complete words (don't→do not). Avoid contractions and casual language.",
      casual:
        'Friendly, conversational tone for social/informal contexts. Contractions welcome. Keep it natural and warm.',
      brief: 'Concise and direct. Remove filler words. Use active voice. Keep only essential information.',
    };

    return `Improve this text:
"${text}"

Style: ${style.toUpperCase()}
${styleInstructions[style]}

IMPORTANT - Never change:
- Names, emails, @mentions
- URLs, numbers, dates
- Technical terms, company names

Provide:
- Corrected text
- Brief explanation of improvements made

Output JSON only:
{"corrected":"improved text","explanation":"brief reason"}`;
  }

  /**
   * Get system prompt for the AI model
   */
  protected getSystemPrompt(): string {
    return `You are Grammar Assistant, helping non-native English speakers write better.

Your mission:
- Fix grammar, spelling, and punctuation errors
- Improve clarity and readability
- Adjust tone to match the requested style
- Preserve the original meaning completely
- Help users learn from corrections

CRITICAL - NEVER change:
- Email addresses (user@domain.com)
- @mentions (@username)
- People's names (John, Maria, etc.)
- URLs and links
- Code snippets
- Technical terms
- Numbers and dates
- Company/product names

Output format (valid JSON only):
{"corrected":"fixed text","explanation":"why changed"}

Rules:
- Start with { and end with }
- No reasoning or thinking
- No markdown formatting
- Keep explanations under 10 words`;
  }
}
