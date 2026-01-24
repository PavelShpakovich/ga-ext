// Abstract AI Provider Interface

import { CorrectionResult, CorrectionStyle } from '../types';
import i18n from 'i18next';

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
    const styleInstructions: Record<CorrectionStyle, string> = {
      [CorrectionStyle.FORMAL]: i18n.t('prompts.style_formal'),
      [CorrectionStyle.STANDARD]: i18n.t('prompts.style_standard'),
      [CorrectionStyle.SIMPLE]: i18n.t('prompts.style_simple'),
      [CorrectionStyle.ACADEMIC]: i18n.t('prompts.style_academic'),
      [CorrectionStyle.CASUAL]: i18n.t('prompts.style_casual'),
    };

    const styleStr = styleInstructions[style] || i18n.t('prompts.style_standard');

    return `${i18n.t('prompts.instruction')}

${i18n.t('prompts.style', { style: styleStr })}

${i18n.t('prompts.text_to_rewrite', { text })}

${i18n.t('prompts.rules_header')}
${i18n.t('prompts.rule_json')}
${i18n.t('prompts.rule_corrected')}
${i18n.t('prompts.rule_explanation')}
${i18n.t('prompts.rule_no_summary')}
${i18n.t('prompts.rule_no_meaning')}
${i18n.t('prompts.rule_unchanged')}

${i18n.t('prompts.example_header')}
{
  "corrected": "Your corrected multilingual text appears here.",
  "explanation": "Fixed punctuation errors; improved verb tense consistency; corrected word order; replaced informal phrasing with formal alternatives."
}

${i18n.t('prompts.json_start')}`;
  }

  /**
   * Get system prompt for the AI model
   */
  protected getSystemPrompt(): string {
    return i18n.t('prompts.system_role');
  }
}
