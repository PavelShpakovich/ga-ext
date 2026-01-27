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
    size: '4.84GB',
    speed: ModelSpeed.SLOW,
    category: ModelCategory.PRO,
    description: 'Elite level rewrites and paragraph restructuring. Requires high VRAM.',
  },
  {
    // Upgraded to Hermes-3 for better JSON adherence
    id: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    name: 'Hermes 3 (Llama 8B)',
    family: 'Meta/Nous',
    size: '4.31GB',
    speed: ModelSpeed.SLOW,
    category: ModelCategory.PRO,
    description: 'Highly obedient model; best for strict professional and formal styles.',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B (Pro)',
    family: 'Alibaba',
    size: '3.99GB',
    speed: ModelSpeed.MEDIUM,
    category: ModelCategory.PRO,
    description: 'Top-tier for technical documentation and non-English text.',
  },

  // --- Balanced (Standard) ---
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B (Standard)',
    family: 'Alibaba',
    size: '1.66GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'Balanced choice for fixing errors while preserving meaning.',
  },

  // --- Ultra-Fast (Flash) ---
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B (Flash)',
    family: 'Alibaba',
    size: '0.83GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.FLASH,
    description: 'Fastest multilingual check for simple errors.',
  },
] as const;

export const STORAGE_KEYS = {
  SETTINGS: 'grammar_assistant_settings',
  PENDING_TEXT: 'pendingText',
  PENDING_ERROR: 'pendingError',
  PENDING_MODEL_DOWNLOAD: 'pendingModelDownload',
  PENDING_AUTO_CORRECT: 'pendingAutoCorrect',
} as const;

export const MAX_TEXT_LENGTH = 12000; // ~3000 tokens
