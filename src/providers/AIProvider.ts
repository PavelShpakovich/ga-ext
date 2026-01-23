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
        'Elevate the tone to be professional, precise, and academic. Use sophisticated vocabulary but DO NOT alter technical terms, proper nouns, or specific data. Avoid contractions, slang, and ambiguity. Ensure a respectful, objective tone while strictly preserving the original meaning.',
      casual:
        'Rewrite for a friendly, social context (like a message to a colleague or friend). Use natural, conversational phrasing and contractions. The tone should be warm, authentic, and approachable, but remain clear and coherent.',
      brief:
        'Condense the text to its absolute essentials. Ruthlessly remove fluff, filler words, redundancy, and unnecessary formatting. Use active voice/imperative mood where appropriate. The result should be punchy, direct, and shorter than the original.',
    };

    return `Task: Acting as an expert editor, correct and improve the user's text.

Target Style: ${style.toUpperCase()}
Style Goal: ${styleInstructions[style]}

Input Text:
"${text}"

Execution Steps:
1. Fix all grammatical, spelling, and punctuation errors primarily.
2. Apply the requested style transformations (vocabulary, tone, sentence structure).
3. Verify that the core meaning and specific entities (names, dates, technical terms) remain UNCHANGED.

Output Requirements:
1. Return ONLY valid JSON.
2. If no corrections are needed, return an empty "changes" array.
3. "confidence" must be 0-1.

JSON Response Format:
{
  "corrected": "The polished text",
  "changes": [
    {
      "type": "grammar" | "spelling" | "punctuation" | "style" | "clarity",
      "explanation": "Concise reason for the change"
    }
  ],
  "confidence": 0.95,
  "summary": "Brief summary of improvements"
}

Analyze text:`;
  }

  /**
   * Get system prompt for the AI model
   */
  protected getSystemPrompt(): string {
    return `You are Grammar Assistant, an expert AI writing editor.
Your mission is to polish user text to perfection based on their selected style (Formal, Casual, Brief).

Core Principles:
1. ACCURACY: Fix all objective errors (grammar, spelling) first.
2. MEANING: Never alter the underlying meaning, facts, or technical terminology.
3. STYLE: Adapt the tone precisely to the requested style guide.
4. FORMAT: Always output strict, valid JSON.

You are running locally on the user's device. Be efficient, precise, and helpful.`;
  }
}
