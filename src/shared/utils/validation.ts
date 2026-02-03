/**
 * Input validation utilities for text processing and security
 */

import { MAX_TEXT_LENGTH } from '@/core/constants';
import { Logger } from '@/core/services/Logger';

export enum ValidationErrorType {
  EMPTY_INPUT = 'empty_input',
  TOO_LONG = 'too_long',
  INVALID_ENCODING = 'invalid_encoding',
  INVALID_CHARACTERS = 'invalid_characters',
  MALICIOUS_CONTENT = 'malicious_content',
}

export interface ValidationResult {
  valid: boolean;
  error?: ValidationErrorType;
  sanitized?: string;
  details?: string;
}

/**
 * Validates text input for correction processing
 * @param text - Input text to validate
 * @param maxLength - Maximum allowed length (default: MAX_TEXT_LENGTH)
 * @returns ValidationResult with sanitized text if valid
 */
export function validateTextInput(text: string, maxLength: number = MAX_TEXT_LENGTH): ValidationResult {
  // Check for empty input
  if (!text || typeof text !== 'string') {
    return {
      valid: false,
      error: ValidationErrorType.EMPTY_INPUT,
      details: 'Input must be a non-empty string',
    };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: ValidationErrorType.EMPTY_INPUT,
      details: 'Input cannot be empty or whitespace only',
    };
  }

  // Check length
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: ValidationErrorType.TOO_LONG,
      details: `Input exceeds maximum length of ${maxLength} characters`,
    };
  }

  // Validate UTF-8 encoding and detect malformed characters
  try {
    // Test for valid Unicode by attempting to encode/decode
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const encoded = encoder.encode(trimmed);
    decoder.decode(encoded);
  } catch (e) {
    Logger.warn('Validation', 'Invalid text encoding detected', e);
    return {
      valid: false,
      error: ValidationErrorType.INVALID_ENCODING,
      details: 'Text contains invalid encoding',
    };
  }

  // Check for excessive null bytes or control characters (potential injection)
  // eslint-disable-next-line no-control-regex
  const nullByteCount = (trimmed.match(/\u0000/g) || []).length;
  if (nullByteCount > 0) {
    return {
      valid: false,
      error: ValidationErrorType.MALICIOUS_CONTENT,
      details: 'Text contains null bytes',
    };
  }

  // Check for excessive control characters (excluding common ones like \n, \t, \r)
  // eslint-disable-next-line no-control-regex
  const controlChars = trimmed.match(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g) || [];
  if (controlChars.length > trimmed.length * 0.1) {
    Logger.warn('Validation', 'Excessive control characters detected', {
      count: controlChars.length,
      total: trimmed.length,
    });
    return {
      valid: false,
      error: ValidationErrorType.INVALID_CHARACTERS,
      details: 'Text contains excessive control characters',
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Validates model ID format
 * @param modelId - Model identifier to validate
 * @returns ValidationResult
 */
export function validateModelId(modelId: string): ValidationResult {
  if (!modelId || typeof modelId !== 'string') {
    return {
      valid: false,
      error: ValidationErrorType.EMPTY_INPUT,
      details: 'Model ID must be a non-empty string',
    };
  }

  const trimmed = modelId.trim();

  // Model IDs should follow naming convention: alphanumeric, hyphens, underscores, dots
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: ValidationErrorType.INVALID_CHARACTERS,
      details: 'Model ID contains invalid characters',
    };
  }

  // Reasonable length check
  if (trimmed.length > 200) {
    return {
      valid: false,
      error: ValidationErrorType.TOO_LONG,
      details: 'Model ID is too long',
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Validates image data URL format
 * @param dataUrl - Image data URL to validate
 * @returns ValidationResult
 */
export function validateImageDataUrl(dataUrl: string): ValidationResult {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return {
      valid: false,
      error: ValidationErrorType.EMPTY_INPUT,
      details: 'Image data URL must be a non-empty string',
    };
  }

  // Check for data URL format
  if (!dataUrl.startsWith('data:image/')) {
    return {
      valid: false,
      error: ValidationErrorType.INVALID_CHARACTERS,
      details: 'Invalid image data URL format',
    };
  }

  // Check for reasonable size (10MB base64)
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  if (dataUrl.length > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: ValidationErrorType.TOO_LONG,
      details: 'Image data URL exceeds maximum size',
    };
  }

  return {
    valid: true,
  };
}
