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

  // --- Reasoning (DeepThink) ---

  {
    id: 'Qwen3-4B-q4f16_1-MLC',
    name: 'Qwen 3 4B (DeepThink)',
    family: 'Alibaba',
    size: '2.27GB',
    speed: ModelSpeed.MEDIUM,
    category: ModelCategory.REASONING,
    description: 'Advanced Qwen 3 reasoning model for complex analysis and sophisticated style refinement.',
  },
  {
    id: 'Qwen3-8B-q4f16_1-MLC',
    name: 'Qwen 3 8B (DeepThink)',
    family: 'Alibaba',
    size: '4.55GB',
    speed: ModelSpeed.SLOW,
    category: ModelCategory.REASONING,
    description: 'Elite Qwen 3 reasoning model for advanced linguistic analysis and comprehensive corrections.',
  },
  {
    id: 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC',
    name: 'DeepSeek R1 Llama 8B (DeepThink)',
    family: 'DeepSeek',
    size: '4.31GB',
    speed: ModelSpeed.MEDIUM,
    category: ModelCategory.REASONING,
    description: 'Powerful reasoning capabilities for nuanced grammar and style improvements.',
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

// OCR constants
export const OCR_LANGUAGE = 'eng';
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/bmp', 'image/webp'] as const;
// Relative path under `public/` where tesseract core and tessdata are expected.
export const OCR_ASSETS_PATH = '/tesseract/core';
