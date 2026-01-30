/**
 * Cache-related configuration
 * Tuning parameters for model caching and deletion verification
 */
export const CACHE_CONFIG = {
  // Cache checking
  checkTimeoutMs: 2000,

  // Model deletion verification with exponential backoff
  deletionRetry: {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 200,
    backoffMultiplier: 2,
  },

  // Cache key generation
  cacheKeyDelimiter: '::',

  // IndexedDB settings
  dbName: 'wllm-cache',
  storeName: 'models',
} as const;
