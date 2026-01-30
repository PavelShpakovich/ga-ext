/**
 * UI-related configuration
 * Tuning parameters for user interface behavior and timing
 */
export const UI_CONFIG = {
  // Message timing
  autoHideMessageDelayMs: 4000,
  toastDurationMs: 3000,

  // Text input
  maxTextLengthChars: 5000,
  maxInputDebounceMs: 300,

  // Model operations
  modelCheckTimeoutMs: 2000,
  prefetchTimeoutMs: 30000,

  // Animation
  transitionDurationMs: 300,
  fadeInDurationMs: 500,

  // Language detection
  minLanguageDetectionChars: 5,
  minLanguageScriptThreshold: 0.4,
  minLanguageStopwordHits: 1,

  // Dropdown positioning
  popoverOffsetPx: 4,
  dropdownWidthRem: '12rem',

  // Z-index scale
  zIndexPopover: 50,
  zIndexModal: 100,
  zIndexDropdown: 50,
} as const;
