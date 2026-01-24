// Type definitions for the extension

export enum CorrectionStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  BRIEF = 'brief',
}

export interface CorrectionResult {
  original: string;
  corrected: string;
  style: CorrectionStyle;
  explanation?: string;
  summary?: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultStyle: CorrectionStyle;
  selectedModel: string;
}
