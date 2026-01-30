// Core types for the simplified grammar assistant

// Supported languages for correction and UI
export enum Language {
  EN = 'en',
  RU = 'ru',
  ES = 'es',
  DE = 'de',
  FR = 'fr',
  JA = 'ja',
}

// We keep style as a simple enum even though the UI defaults to a single option,
// which leaves room for future tone tweaks without widening the surface area elsewhere.
export enum CorrectionStyle {
  FORMAL = 'formal',
  STANDARD = 'standard',
  SIMPLE = 'simple',
  ACADEMIC = 'academic',
  CASUAL = 'casual',
}

export enum ExecutionStep {
  IDLE = 'idle',
  PREPARING_MODEL = 'preparing-model',
  CORRECTING = 'correcting',
  DONE = 'done',
  ERROR = 'error',
}

export enum ModelProgressState {
  DOWNLOADING = 'downloading',
  LOADING = 'loading',
}

export interface ModelProgress {
  text: string;
  progress: number; // 0-1
  state: ModelProgressState;
  modelId?: string;
}

export enum ModelSpeed {
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow',
}

export enum ModelCategory {
  PRO = 'pro',
  STANDARD = 'standard',
  REASONING = 'reasoning',
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  size?: string;
  speed?: ModelSpeed;
  family?: string;
  category?: ModelCategory;
}

export interface CorrectionResult {
  original: string;
  corrected: string;
  // Explanation may be a plain string or an array of lines/messages
  explanation?: string | string[];
  raw?: string;
  parseError?: string;
}

export interface Settings {
  selectedModel: string;
  selectedStyle: CorrectionStyle;
  language: Language; // UI language
  correctionLanguage: Language; // Language of text being corrected
}

export enum InputMode {
  TEXT = 'text',
  OCR = 'ocr',
}
