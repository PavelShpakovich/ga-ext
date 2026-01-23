// Type definitions for the extension

export enum CorrectionStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  BRIEF = 'brief',
}

export interface Change {
  type: 'grammar' | 'spelling' | 'punctuation' | 'style' | 'clarity' | 'error';
  explanation: string;
}

export interface CorrectionResult {
  original: string;
  corrected: string;
  style: CorrectionStyle;
  changes: Change[];
  confidence: number;
  summary?: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultStyle: CorrectionStyle;
  selectedModel: string;
}
