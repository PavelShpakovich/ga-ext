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
    description: 'Best for complex rewrites, deep stylistic changes, and paragraph restructuring.',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.1 8B (Pro)',
    family: 'Meta',
    size: '4.31GB',
    speed: ModelSpeed.SLOW,
    category: ModelCategory.PRO,
    description: 'Excellent for polishing professional reports and business correspondence.',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B (Pro)',
    family: 'Alibaba',
    size: '3.99GB',
    speed: ModelSpeed.MEDIUM,
    category: ModelCategory.PRO,
    description: 'The specialist for multilingual grammar and technical documentation.',
  },

  // --- Balanced (Standard) ---
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B (Standard)',
    family: 'Meta',
    size: '1.72GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'Perfect for quick daily grammar fixes and polishing chat messages.',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B (Standard)',
    family: 'Alibaba',
    size: '1.66GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'Balanced choice for fixing errors while preserving your original meaning.',
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma 2 2B (Standard)',
    family: 'Google',
    size: '1.40GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'Lightweight and creative; ideal for simple sentence rewrites.',
  },

  // --- Ultra-Fast (Flash) ---
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B (Flash)',
    family: 'Alibaba',
    size: '0.83GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.FLASH,
    description: 'Instantaneous checks for typos and basic punctuation errors.',
  },
  {
    id: 'gemma-2-1.3b-it-q4f16_1-MLC',
    name: 'Gemma 2 1.3B (Flash)',
    family: 'Google',
    size: '0.60GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.FLASH,
    description: 'Small, efficient Gemma variant for very low-latency typo fixes and short corrections.',
  },
  {
    id: 'Llama-3.2-1.4B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1.4B (Flash)',
    family: 'Meta',
    size: '0.75GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.FLASH,
    description: 'Lightweight Llama 3 variant optimized for quick JSON outputs and short-context corrections.',
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
