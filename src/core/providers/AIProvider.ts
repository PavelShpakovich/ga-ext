// Abstract AI Provider Interface

import { CorrectionResult, CorrectionStyle } from '@/shared/types';
import i18n from 'i18next';
import { PROMPTS } from '@/core/prompt-templates';

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
    const promptSet = PROMPTS.en;
    const styleStr = promptSet.styleInstructions[style] || promptSet.styleInstructions[CorrectionStyle.STANDARD];

    return promptSet.user.replace(/{style}/g, styleStr).replace(/{text}/g, text);
  }

  /**
   * Get system prompt for the AI model
   */
  protected getSystemPrompt(): string {
    const promptSet = PROMPTS.en;

    return promptSet.system;
  }
}
