import { ModelSpeed, ModelCategory, Language } from '@/shared/types';

// Global constants for the simplified flow

export const DEFAULT_MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC';
export const DEFAULT_LANGUAGE = Language.EN;

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
  {
    id: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    name: 'Hermes 3 8B (Pro)',
    family: 'Meta/NousResearch',
    size: '4.76GB',
    speed: ModelSpeed.MEDIUM,
    category: ModelCategory.PRO,
    description: 'Optimized for structured text correction with detailed reasoning.',
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
  {
    id: 'Mistral-7B-Instruct-v0.2-q4f16_1-MLC',
    name: 'Mistral 7B (Standard)',
    family: 'Mistral',
    size: '4.46GB',
    speed: ModelSpeed.FAST,
    category: ModelCategory.STANDARD,
    description: 'Fast and efficient model balancing speed and quality.',
  },
] as const;

export const LANGUAGE_CONFIG = {
  [Language.EN]: { name: 'English', tesseractCode: 'eng' },
  [Language.RU]: { name: 'Русский', tesseractCode: 'rus' },
  [Language.ES]: { name: 'Español', tesseractCode: 'spa' },
  [Language.DE]: { name: 'Deutsch', tesseractCode: 'deu' },
  [Language.FR]: { name: 'Français', tesseractCode: 'fra' },
} as const;

export const STORAGE_KEYS = {
  SETTINGS: 'grammar_assistant_settings',
  PENDING_TEXT: 'pendingText',
  PENDING_ERROR: 'pendingError',
  PENDING_MODEL_DOWNLOAD: 'pendingModelDownload',
  PENDING_AUTO_CORRECT: 'pendingAutoCorrect',
} as const;

export const MAX_TEXT_LENGTH = 6000; // ~1500 tokens (aligned with 2048 context window)
export const DIFF_MAX_TEXT_LENGTH = 10000; // Skip diff for very large texts for performance

// Timeout constants
export const AUTO_HIDE_MESSAGE_DELAY = 3500;
export const CACHE_CHECK_TIMEOUT_MS = 5000;
export const MODEL_IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
export const OCR_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// OCR constants
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/bmp', 'image/webp'] as const;
// Relative path under `public/` where tesseract core and tessdata are expected.
export const OCR_ASSETS_PATH = '/tesseract/core';
