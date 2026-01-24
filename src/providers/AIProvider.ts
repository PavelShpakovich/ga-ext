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
      formal: 'formal, professional, no contractions',
    } as const;

    return `Instruction: Rewrite the following text and explain the corrections.
Style: ${styleInstructions[style] || 'Standard'}
Text to rewrite: "${text}"

Rules:
1. Output ONLY a JSON object.
2. "corrected": STRING - The full rewritten text.
3. "explanation": STRING - List specific grammatical, punctuation, or stylistic fixes made (e.g., "Fixed subject-verb agreement", "Improved flow"). Do NOT summarize the content of the text.

Example:
{
  "corrected": "How are you doing today?",
  "explanation": "Fixed punctuation and corrected the informal 'u' to 'you'."
}

JSON:`;
  }

  /**
   * Get system prompt for the AI model
   */
  protected getSystemPrompt(): string {
    return `You are a professional editor. You ONLY output JSON.
The "explanation" key must strictly describe linguistic, grammatical, and stylistic changes.
NEVER summarize the meaning, bugs, or content of the user's text.
Focus only on what was fixed (e.g., "Changed passive to active voice", "Corrected punctuation").`;
  }
}
