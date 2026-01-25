// Global constants for the simplified flow

export const DEFAULT_MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

export const SUPPORTED_MODELS = [
  {
    id: 'gemma-2-9b-it-q4f16_1-MLC',
    name: 'Gemma 2 9B',
    family: 'Google',
    size: '6.4GB',
    speed: 'slow',
    description: 'Gold standard for multilingual grammar correction and reasoning.',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.1 8B',
    family: 'Meta',
    size: '5.0GB',
    speed: 'slow',
    description: 'Highly reliable multilingual model with support for 8+ major languages.',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B',
    family: 'Alibaba',
    size: '5.1GB',
    speed: 'medium',
    description: 'Exceptional performance in 29+ languages. Best for formal writing.',
  },
  {
    id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
    name: 'Mistral 7B v0.3',
    family: 'Mistral',
    size: '4.6GB',
    speed: 'medium',
    description: 'European language specialist. Efficient and highly capable.',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi 3.5 Mini',
    family: 'Microsoft',
    size: '2.4GB',
    speed: 'fast',
    description: 'Lightweight model with great reasoning capabilities.',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B',
    family: 'Alibaba',
    size: '2.5GB',
    speed: 'fast',
    description: 'Perfect balance of speed and multilingual intelligence.',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B',
    family: 'Meta',
    size: '2.0GB',
    speed: 'fast',
    description: 'Modern, efficient model for reliable multilingual corrections.',
  },
] as const;

export const STORAGE_KEYS = {
  SETTINGS: 'grammar_assistant_settings',
  PENDING_TEXT: 'pendingText',
  PENDING_MODEL_DOWNLOAD: 'pendingModelDownload',
  PENDING_AUTO_CORRECT: 'pendingAutoCorrect',
} as const;
