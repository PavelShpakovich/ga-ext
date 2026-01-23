// Type definitions for the extension

export enum CorrectionStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  BRIEF = 'brief',
}

export interface Change {
  type: 'grammar' | 'spelling' | 'style' | 'tone';
  original: string;
  corrected: string;
  explanation: string;
  position?: { start: number; end: number };
  importance?: 'high' | 'medium' | 'low';
}

export interface CorrectionResult {
  original: string;
  corrected: string;
  style: CorrectionStyle;
  changes: Change[];
  confidence: number;
  summary?: string;
}

export interface Message {
  action: string;
  [key: string]: any;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultStyle: CorrectionStyle;
  aiProvider: 'cloud' | 'local';
  selectedModel?: string;
  apiKey?: string;
}
