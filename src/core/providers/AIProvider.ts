// Abstract AI Provider Interface

import { CorrectionResult, CorrectionStyle, Language } from '@/shared/types';
import { PROMPTS } from '@/core/prompt-templates';
import { ModelCapabilityRegistry } from '@/core/services';

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
    // Initialize capability registry on first provider instance
    ModelCapabilityRegistry.initialize().catch(() => {
      // Silently ignore initialization errors
    });
  }

  /**
   * Correct the given text with the specified style
   * @param text Original text
   * @param style Preferred writing style
   * @param language Language for context-specific corrections
   * @param onPartialText Optional callback for streaming partial results
   */
  abstract correct(
    text: string,
    style: CorrectionStyle,
    language: Language,
    onPartialText?: (text: string) => void,
  ): Promise<CorrectionResult>;

  /**
   * Unload the model to free up resources
   */
  abstract unload(): Promise<void>;

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
  protected buildPrompt(text: string, style: CorrectionStyle, language: Language): string {
    const promptSet = PROMPTS[language] || PROMPTS[Language.EN];
    const styleStr = promptSet.styleInstructions[style] || promptSet.styleInstructions[CorrectionStyle.STANDARD];

    return promptSet.user.replace(/{style}/g, styleStr).replace(/{text}/g, text);
  }

  /**
   * Get system prompt for the AI model
   */
  protected getSystemPrompt(language: Language): string {
    const promptSet = PROMPTS[language] || PROMPTS[Language.EN];

    return promptSet.system;
  }
}
