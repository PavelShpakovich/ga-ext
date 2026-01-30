/**
 * Provider-related configuration
 * Tuning parameters for WebLLM provider initialization and execution
 */
export const PROVIDER_CONFIG = {
  // Initialization
  maxInitAttempts: 2,

  // Progress tracking
  progressBounds: { min: 0, max: 1 },
  initialProgress: 0,
  completedProgress: 1,

  // Model execution
  defaultTemperature: 0.0,
  defaultMaxTokens: 1024,
  frequencyPenalty: 0.5, // Prevent repetitive looping
  presencePenalty: 0.3, // Encourage diverse improvements

  // Timeout values (in milliseconds)
  initTimeoutMs: 30000,
  executionTimeoutMs: 120000,
} as const;
