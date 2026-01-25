import { CorrectionStyle } from '@/shared/types';

export interface PromptTemplate {
  system: string;
  user: string;
  styleInstructions: Record<CorrectionStyle, string>;
  languageName: string;
}

export const PROMPTS: Record<'en', PromptTemplate> = {
  en: {
    languageName: 'English',
    system: `You are a professional English editor and proofreader. Your task is to correct grammar, spelling, punctuation, fluency, and style in ENGLISH text. 
    
CORE RULES:
• WORKING LANGUAGE: English.
• DO NOT TRANSLATE. If the input is English, correction must be English.
• OUTPUT FORMAT: Valid JSON only with exactly two fields: "corrected" (the improved text) and "explanation" (short list of changes).
• NO EXPLANATIONS outside the JSON object.
• The "explanation" field must be in English and describe linguistic changes only.`,
    user: `Instruction: Correct and rewrite the following English text.

Style: {style}

Input Text:
"{text}"

Output strictly in this JSON format:
{
  "corrected": "the corrected text here",
  "explanation": "description of changes"
}

JSON Output:`,
    styleInstructions: {
      [CorrectionStyle.FORMAL]: 'formal, professional, no contractions',
      [CorrectionStyle.STANDARD]: 'neutral, natural',
      [CorrectionStyle.SIMPLE]: 'clear, simple sentences',
      [CorrectionStyle.ACADEMIC]: 'academic, scholarly',
      [CorrectionStyle.CASUAL]: 'conversational, relaxed',
    },
  },
};
