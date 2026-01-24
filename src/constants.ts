// Global constants for the simplified flow

export const DEFAULT_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

export const SUPPORTED_MODELS = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B',
    family: 'Meta',
    size: '1.2GB',
    speed: 'fast',
    description: 'Extremely fast and efficient. Best for simple grammar and spelling fixes.',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B',
    family: 'Alibaba',
    size: '1.6GB',
    speed: 'fast',
    description: 'Excellent all-rounder with superior instruction following and formal tone.',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi 3.5 Mini',
    family: 'Microsoft',
    size: '2.4GB',
    speed: 'medium',
    description: 'High-quality 3.8B model. Great for complex rewriting and deep clarity.',
  },
  {
    id: 'Gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma 2 2B',
    family: 'Google',
    size: '1.8GB',
    speed: 'medium',
    description: 'Robust and creative. Highly effective for stylistic improvements.',
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 0.5B',
    family: 'Alibaba',
    size: '0.6GB',
    speed: 'fast',
    description: 'Ultralight model for low-end hardware. Basic core corrections.',
  },
] as const;

export const STORAGE_KEYS = {
  SETTINGS: 'grammar_assistant_settings',
  PENDING_TEXT: 'pendingText',
  PENDING_MODEL_DOWNLOAD: 'pendingModelDownload',
  PENDING_AUTO_CORRECT: 'pendingAutoCorrect',
} as const;
