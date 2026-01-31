import { Language } from '@/shared/types';

/**
 * Compatibility level indicator for model language support
 * - excellent: Native or near-native support
 * - good: Strong support with minor issues
 * - fair: Adequate support but may miss nuances
 * - limited: Weak support, not recommended
 */
export enum CompatibilityLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  LIMITED = 'limited',
}

export interface ModelLanguageCompatibility {
  modelId: string;
  language: Language;
  level: CompatibilityLevel;
  notes?: string;
}

/**
 * Compatibility level color values for UI display
 * Matches Tailwind color palette
 */
const COMPATIBILITY_COLORS = {
  [CompatibilityLevel.EXCELLENT]: '#10b981', // emerald-500
  [CompatibilityLevel.GOOD]: '#3b82f6', // blue-500
  [CompatibilityLevel.FAIR]: '#f59e0b', // amber-500
  [CompatibilityLevel.LIMITED]: '#ef4444', // red-500
} as const;

/**
 * Language compatibility matrix for different models
 * Based on model training data and multilingual capabilities
 * Updated to match SUPPORTED_MODELS from constants.ts
 */
const COMPATIBILITY_MATRIX: readonly ModelLanguageCompatibility[] = [
  // --- PRO MODELS ---

  // Gemma-2-9B-it - Large model, English-focused
  {
    modelId: 'gemma-2-9b-it-q4f16_1-MLC',
    language: Language.EN,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Native English - elite quality',
  },
  {
    modelId: 'gemma-2-9b-it-q4f16_1-MLC',
    language: Language.RU,
    level: CompatibilityLevel.FAIR,
    notes: 'Limited Russian support',
  },
  {
    modelId: 'gemma-2-9b-it-q4f16_1-MLC',
    language: Language.ES,
    level: CompatibilityLevel.GOOD,
    notes: 'Good Spanish support',
  },
  {
    modelId: 'gemma-2-9b-it-q4f16_1-MLC',
    language: Language.DE,
    level: CompatibilityLevel.GOOD,
    notes: 'Good German support',
  },
  {
    modelId: 'gemma-2-9b-it-q4f16_1-MLC',
    language: Language.FR,
    level: CompatibilityLevel.FAIR,
    notes: 'Limited French support',
  },

  // Qwen2.5-7B-Instruct - Best overall multilingual support
  {
    modelId: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    language: Language.EN,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Native English support',
  },
  {
    modelId: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    language: Language.RU,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Excellent Russian grammar support',
  },
  {
    modelId: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    language: Language.ES,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Strong Spanish support',
  },
  {
    modelId: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    language: Language.DE,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Strong German cases and grammar',
  },
  {
    modelId: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    language: Language.FR,
    level: CompatibilityLevel.GOOD,
    notes: 'Good French support',
  },

  // Hermes-3-Llama-3.1-8B - Structured text optimization
  {
    modelId: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    language: Language.EN,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Excellent for structured English text',
  },
  {
    modelId: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    language: Language.RU,
    level: CompatibilityLevel.FAIR,
    notes: 'Fair Russian support',
  },
  {
    modelId: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    language: Language.ES,
    level: CompatibilityLevel.GOOD,
    notes: 'Good Spanish support',
  },
  {
    modelId: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    language: Language.DE,
    level: CompatibilityLevel.GOOD,
    notes: 'Good German support',
  },
  {
    modelId: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    language: Language.FR,
    level: CompatibilityLevel.FAIR,
    notes: 'Fair French support',
  },

  // --- STANDARD MODELS ---

  // Qwen2.5-3B-Instruct - Good multilingual
  {
    modelId: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    language: Language.EN,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Strong English - recommended',
  },
  {
    modelId: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    language: Language.RU,
    level: CompatibilityLevel.GOOD,
    notes: 'Good Russian support',
  },
  {
    modelId: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    language: Language.ES,
    level: CompatibilityLevel.GOOD,
    notes: 'Good Spanish support',
  },
  {
    modelId: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    language: Language.DE,
    level: CompatibilityLevel.GOOD,
    notes: 'Good German support',
  },
  {
    modelId: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    language: Language.FR,
    level: CompatibilityLevel.FAIR,
    notes: 'Fair French support',
  },

  // Mistral-7B-Instruct - Efficient multilingual
  {
    modelId: 'Mistral-7B-Instruct-v0.2-q4f16_1-MLC',
    language: Language.EN,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Strong English',
  },
  {
    modelId: 'Mistral-7B-Instruct-v0.2-q4f16_1-MLC',
    language: Language.RU,
    level: CompatibilityLevel.FAIR,
    notes: 'Limited Russian support - not recommended',
  },
  {
    modelId: 'Mistral-7B-Instruct-v0.2-q4f16_1-MLC',
    language: Language.ES,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Strong Spanish support',
  },
  {
    modelId: 'Mistral-7B-Instruct-v0.2-q4f16_1-MLC',
    language: Language.DE,
    level: CompatibilityLevel.GOOD,
    notes: 'Good German support',
  },
  {
    modelId: 'Mistral-7B-Instruct-v0.2-q4f16_1-MLC',
    language: Language.FR,
    level: CompatibilityLevel.EXCELLENT,
    notes: 'Excellent French support (native)',
  },
];

/**
 * Registry for model-language compatibility information
 * Provides methods to query compatibility levels, colors, and labels for different model-language pairs
 *
 * @example
 * const level = LanguageCompatibilityRegistry.getCompatibility('modelId', Language.EN);
 * const color = LanguageCompatibilityRegistry.getCompatibilityColor(level);
 */
export class LanguageCompatibilityRegistry {
  /**
   * Get compatibility level for a specific model and language
   */
  static getCompatibility(modelId: string, language: Language): CompatibilityLevel {
    const compat = COMPATIBILITY_MATRIX.find((c) => c.modelId === modelId && c.language === language);
    return compat?.level || CompatibilityLevel.FAIR;
  }

  /**
   * Get all compatibility info for a language
   */
  static getLanguageCompatibilities(language: Language): ModelLanguageCompatibility[] {
    return COMPATIBILITY_MATRIX.filter((c) => c.language === language).sort((a, b) => {
      const levelOrder = {
        [CompatibilityLevel.EXCELLENT]: 0,
        [CompatibilityLevel.GOOD]: 1,
        [CompatibilityLevel.FAIR]: 2,
        [CompatibilityLevel.LIMITED]: 3,
      };
      return levelOrder[a.level] - levelOrder[b.level];
    });
  }

  /**
   * Get best models for a specific language (excellent + good)
   */
  static getBestModelsForLanguage(language: Language): string[] {
    return COMPATIBILITY_MATRIX.filter(
      (c) =>
        c.language === language && (c.level === CompatibilityLevel.EXCELLENT || c.level === CompatibilityLevel.GOOD),
    )
      .map((c) => c.modelId)
      .filter((id, idx, arr) => arr.indexOf(id) === idx);
  }

  /**
   * Get notes for model-language combination
   */
  static getCompatibilityNotes(modelId: string, language: Language): string | undefined {
    return COMPATIBILITY_MATRIX.find((c) => c.modelId === modelId && c.language === language)?.notes;
  }

  /**
   * Get color for compatibility badge
   */
  static getCompatibilityColor(level: CompatibilityLevel): string {
    return COMPATIBILITY_COLORS[level] || '#6b7280';
  }
}
