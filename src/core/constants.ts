import { ModelSpeed, ModelCategory } from '@/shared/types';

// Global constants for the simplified flow

export const DEFAULT_MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC';
export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_MODELS = [
  // --- High-Quality (Pro) ---
  {
    id: 'gemma-2-9b-it-q4f16_1-MLC',
    name: 'Gemma 2 9B (Pro)',
    family: 'Google',
    size: '6.4GB',
    speed: ModelSpeed.SLOW,
    category: ModelCategory.PRO,
    description: 'Gold standard for professional writing and deep stylistic analysis.',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.1 8B (Pro)',
    family: 'Meta',
    size: '5.0GB',
    speed: ModelSpeed.SLOW,
    category: ModelCategory.PRO,
    description: 'Highly robust and reliable model for complex professional tasks.',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B (Pro)',
    family: 'Alibaba',
    size: '5.1GB',
    speed: ModelSpeed.MEDIUM,
    category: ModelCategory.PRO,
    description: 'Exceptional multilingual performance in 29+ languages.',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi 3.5 Mini (Advanced)',
    family: 'Microsoft',
    size: '2.4GB',
    speed: ModelSpeed.MEDIUM,
    category: ModelCategory.PRO,
    description: 'Compact size with reasoning capabilities that rival 7B+ models.',
  },

  // --- Balanced (Standard) ---
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B (Standard)',
    family: 'Meta',
    size: '2.0GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'The sweet spot for speed and instruction-following quality.',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B (Standard)',
    family: 'Alibaba',
    size: '2.5GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'Balanced performance for structured corrections and formal writing.',
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma 2 2B (Standard)',
    family: 'Google',
    size: '1.8GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'Creative and efficient; great for capturing nuanced tones.',
  },

  // --- Ultra-Fast (Flash) ---
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B (Flash)',
    family: 'Alibaba',
    size: '1.3GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.FLASH,
    description: 'Ultra-fast; excellent multilingual support for quick edits.',
  },
] as const;

export const STORAGE_KEYS = {
  SETTINGS: 'grammar_assistant_settings',
  PENDING_TEXT: 'pendingText',
  PENDING_MODEL_DOWNLOAD: 'pendingModelDownload',
  PENDING_AUTO_CORRECT: 'pendingAutoCorrect',
} as const;
