// Core types for the simplified grammar assistant

// We keep style as a simple enum even though the UI defaults to a single option,
// which leaves room for future tone tweaks without widening the surface area elsewhere.
export enum CorrectionStyle {
  FORMAL = 'formal',
  STANDARD = 'standard',
  SIMPLE = 'simple',
  ACADEMIC = 'academic',
  CASUAL = 'casual',
}

export interface CorrectionResult {
  original: string;
  corrected: string;
  explanation?: string;
  raw?: string;
  parseError?: string;
}

export type ExecutionStep = 'idle' | 'preparing-model' | 'correcting' | 'done' | 'error';

export interface ModelProgress {
  text: string;
  progress: number; // 0-1
  state: 'downloading' | 'loading';
  modelId?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  size?: string;
  speed?: 'fast' | 'medium' | 'slow';
  family?: string;
}

export interface Settings {
  selectedModel: string;
  selectedStyle: CorrectionStyle;
  language: 'en' | 'ru';
}
