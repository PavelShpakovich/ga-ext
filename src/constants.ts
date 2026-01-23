// Global constants

export const APP_NAME = 'Grammar Assistant';
export const APP_VERSION = '0.1.0';

export const CORRECTION_STYLES = {
  FORMAL: 'formal',
  CASUAL: 'casual',
  BRIEF: 'brief',
} as const;

export const AI_PROVIDERS = {
  CLOUD: 'cloud',
  LOCAL: 'local',
} as const;

export const AVAILABLE_MODELS = [
  {
    id: 'phi-2',
    name: 'Phi-2',
    size: '1.5GB',
    description: 'Best quality for grammar correction',
    recommended: true,
  },
  {
    id: 'tinyllama',
    name: 'TinyLlama',
    size: '600MB',
    description: 'Fastest, good for quick corrections',
    recommended: false,
  },
  {
    id: 'gemma-2b',
    name: 'Gemma-2B',
    size: '1.2GB',
    description: 'Balanced speed and quality',
    recommended: false,
  },
];

export const STORAGE_KEYS = {
  SETTINGS: 'grammar_assistant_settings',
  HISTORY: 'grammar_assistant_history',
  MODEL_CACHE: 'grammar_assistant_model',
} as const;

export const MAX_HISTORY_ITEMS = 50;
export const MAX_TEXT_LENGTH = 5000;
