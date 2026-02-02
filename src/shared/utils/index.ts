/**
 * Barrel export for all shared utility functions and helpers.
 * Provides centralized access to common utilities used across the application.
 */

// General helpers
export {
  isWebGPUAvailable,
  generateCacheKey,
  normalizeDownloadProgress,
  copyToClipboard,
  capitalize,
  detectDominantLanguage,
} from './helpers';
export type { OCRProgress } from './helpers';

// Text diff utilities
export { getDiff } from './diff';
export type { DiffPart } from './diff';

// Pending storage utilities (inter-context communication)
export {
  getSessionStorage,
  isPayloadExpired,
  isPendingTextPayload,
  isPendingErrorPayload,
  setPendingText,
  setPendingError,
  clearStalePending,
} from './pendingStorage';
export type { PendingTextPayload, PendingErrorPayload } from './pendingStorage';
