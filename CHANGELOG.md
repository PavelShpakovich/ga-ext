# Changelog

All notable changes to Grammar Assistant will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.5] - 2026-02-02

### Added

- **Web Workers for Diff**: Offloaded diff computation to Web Worker for better UI responsiveness
  - Created `shared/workers/diff.worker.ts` for background diff computation
  - Added `DiffWorkerManager` service with Promise-based API and automatic fallback
  - New `useDiff` hook replaces synchronous `getDiff()` calls in React components
  - Prevents UI freezing when computing diffs for large text corrections
  - Webpack 5 worker support with automatic code splitting

### Changed

- `ResultSection` now uses `useDiff` hook for asynchronous diff computation
- Webpack output configured with `globalObject: 'self'` for Web Worker compatibility

### Fixed

- **Model Disposal Race Condition**: Prevented WebLLM "Object already disposed" errors
  - Added operation tracking to `ProviderFactory` (startOperation/endOperation/hasActiveOperations)
  - Idle timeout now skips model unloading when corrections are in progress
  - `correct()` method wrapped with try/finally to ensure operation tracking cleanup

## [0.4.4] - 2026-02-02

### Added

- **Bundle Analysis**: Added webpack-bundle-analyzer for visualizing bundle composition
  - New `npm run analyze` script generates interactive HTML report
  - Analysis shows background.js (5.38 MiB) dominated by WebLLM library
  - Identified optimization targets: WebLLM code splitting, tesseract lazy loading, icon optimization

### Developer

- Configured webpack-bundle-analyzer plugin with static HTML report generation

## [0.4.3] - 2026-02-02

### Added

- **Service Worker Optimization**: Modular architecture with enhanced lifecycle management
  - Split `background/index.ts` into focused modules: `messageHandler`, `commandHandler`, `modelManager`
  - Implemented alarm-based idle timeout using `chrome.alarms` API (more reliable across service worker restarts)
  - Added memory pressure monitoring for automatic model unloading during low memory conditions
  - Removed setTimeout-based idle timer in favor of Chrome's alarm system
- **Provider Factory Enhancement**: Improved model management with callback hooks
  - Added activity tracking via `setActivityCallback` for model usage monitoring
  - Added `setModelLoadedCallback` to automatically start idle monitoring when models load
  - Decoupled idle timeout logic from ProviderFactory for better separation of concerns
- **Background Module System**: New modular structure enables lazy loading and better organization
  - `modules/messageHandler.ts`: Runtime message routing (OCR, side panel, model downloads)
  - `modules/commandHandler.ts`: Keyboard shortcuts and context menu events
  - `modules/modelManager.ts`: Model lifecycle with alarm-based timeouts and memory management
  - `modules/index.ts`: Barrel export for clean imports

### Changed

- Refactored idle timeout mechanism from setTimeout (10-minute timer) to chrome.alarms (1-minute periodic checks)
- Main background script now orchestrates modules instead of containing all logic
- Improved service worker reliability during wake/sleep cycles

### Technical Notes

- Background bundle remains stable at ~5.38 MiB (includes WebLLM)
- All 136 tests passing, 0 lint errors
- Better memory management reduces risk of extension crashes on low-memory devices

## [0.4.2] - 2026-02-02

### Changed

- **Code Architecture**: Major refactoring to improve maintainability and code organization
  - Extracted utility functions into dedicated modules (`pendingStorage.ts`, `contextMenu.ts`, `tesseractWorker.ts`)
  - Reduced `background/index.ts` from 228 to 180 lines by eliminating 60+ lines of duplication
  - Split large `SidePanel.tsx` component (547 lines) into focused, reusable hooks (472 lines, 14% reduction)
- **Custom Hooks**: Created three new specialized hooks for better separation of concerns
  - `useLanguageMismatch`: Language detection and mismatch warning logic (83 lines)
  - `useToastNotifications`: Toast notification management (57 lines)
  - `useCorrectionActions`: Correction workflow with language validation (136 lines)
- **Documentation**: Added comprehensive JSDoc comments to all utility functions and modules
  - Module-level documentation for `ContextMenu`, `TesseractWorker`, and `PendingStorage`
  - Parameter and return type documentation for all public functions
  - Created barrel exports (`hooks/index.ts`, `utils/index.ts`) for cleaner import paths
- **Type Safety**: Improved type definitions throughout the codebase
  - Replaced generic `any` types with proper interfaces (`CorrectionResult`, `Record<string, unknown>`)
  - Added explicit type annotations for all hook parameters and return values

### Fixed

- **React Hook Dependencies**: Resolved all ESLint warnings for missing hook dependencies
- **Variable Scope**: Fixed declaration order issues to prevent "used before assigned" errors

## [0.4.1] - 2026-01-31

### Added

- **Partial Success Mode**: Implemented graceful degradation for parsing failures - corrected text is now displayed even when full JSON parsing fails
- **Enhanced Prompt Templates**: Added visual examples (✓/❌) and stricter JSON-only requirements to all 5 language prompts to prevent malformed output
- **Response Extraction**: Added `extractCorrectedTextOnly()` method with 4 regex patterns to extract corrected text from partially malformed responses
- **Localized Error Messages**: Added `explanation_unavailable` translation key to all 5 languages for partial success scenarios

### Changed

- **Language Compatibility Ratings**: Updated based on real-world testing:
  - Mistral-7B Russian: GOOD → FAIR (not recommended for Russian)
  - Mistral-7B French: GOOD → EXCELLENT (native French support)
  - Hermes-3 Russian: GOOD → FAIR (limited Cyrillic support)
  - Gemma-2-9B Spanish/German: FAIR → GOOD (improved ratings for larger model)
- **Prompt Structure**: Enhanced all prompts with explicit "No trailing text after JSON" and "Nothing before, nothing after" instructions
- **Error Handling**: Parsing errors no longer block display of corrected text when partial extraction succeeds

### Fixed

- **Critical Parsing Bug**: Fixed issue where valid corrected text was hidden behind error message when explanation array failed to parse
- **JSON Validation**: Removed `parseError` field from partial success results to prevent UI from treating them as errors
- **User Experience**: Users now always see corrected text even if model outputs malformed JSON structure

## [0.4.0] - 2026-01-31

### Added

- **Theme System**: Implemented light/dark/system theme switching with localStorage persistence and cross-tab synchronization
- **Theme-Aware Icons**: Added light variant icon (`icon128-light.png`) for light theme display in header and popup
- **Single-Button Theme Selector**: Created cycle-based theme toggle button in header for seamless theme switching
- **Enhanced Dark Mode Support**: Comprehensive dark mode styling across all UI components (Toast, TextButton, Card, etc.)
- **Language Compatibility Matrix**: Expanded and aligned compatibility data for all 5 supported models

### Changed

- **Model Lineup**: Removed Llama 3.2 1B model - now focused on 5 high-quality models (3 Pro, 2 Standard)
- **JSON Output Validation**: Strengthened prompt templates with explicit escaping rules to prevent JSON parsing errors
- **Language Compatibility**: Updated compatibility levels for remaining models based on real-world performance data
- **Prompt Templates**: Enhanced all 5 language prompts (EN, RU, ES, DE, FR) with stricter JSON validation guidelines
- **Icon Selection**: Dynamic icon selection based on theme preference in both header and popup

### Removed

- **Llama 3.2 1B Model**: Removed from constants, locale files, and compatibility matrix due to lower output quality

### Fixed

- **Dark Mode Text Contrast**: Fixed TextButton and Toast dark mode visibility issues
- **Card Dark Colors**: Corrected invalid Tailwind colors (gray-850 → slate-900)

## [0.3.0] - 2026-01-30

### Added

- **Task-based Provider Factory**: Implemented a sequential processing queue for AI provider instantiation. This guarantees atomic model switches and prevents WebGPU resource collisions when switching models rapidly.
- **OCR Memory Management**: Added a 5-minute idle-timeout for the Tesseract.js worker in the offscreen document to reclaim system memory during inactivity.
- **VRAM Hardening**: Enhanced `WebLLMProvider` with proactive engine reference nullification to prevent double-free errors and race conditions in the underlying WebGPU stack.
- **Performance Guards**:
  - Added a 5-second safety timeout for IndexedDB cache checks to prevent the UI from hanging if the database is locked.
  - Implemented character limit thresholds (10k) in the diff engine to skip expensive calculations on extremely large texts.
- **Centralized Constants**: Consolidated all hardware limits, timeouts, and thresholds into `src/core/constants.ts` for easier system tuning.

### Changed

- **UI Language Gating**: Replaced simple toasts with a blocking "Allowance" alert system for language mismatches, providing a clearer path for users to switch languages or confirm intent.
- **Integrated OCR Mismatch Detection**: Language mismatch checks now automatically apply to text extracted using OCR.
- **Hook Optimization**: Refactored `useSettings` to eliminate redundant storage writes during initialization, reducing re-renders and improving startup performance.
- **Prompt Refinement**: Standardized lowercase JSON field name requirements across all supported languages (EN, RU, DE, ES, FR) to match our high-reliability parser.

### Removed

- **Japanese Language Support**: Completely removed everything related to Japanese (prompts, constants, translations, and logic) to reduce library bloat and focus on primary supported regions.

### Fixed

- Resolved the "Detected X, but you have X selected" error caused by stale mismatch states in the React lifecycle.
- Fixed a bug where SidePanel headers wouldn't synchronize immediately when changing the correction language in settings.
- Corrected casing errors in Russian prompt templates that caused JSON parse failures.

### Dev

- Bumped project version to `0.3.0`.
- All tests passing (53 tests), WebGPU model lifecycle verified.

## [0.2.1] - 2026-01-30

### Added

- **ResponseValidator service**: Comprehensive JSON parsing with 5 progressive recovery strategies to handle malformed LLM responses.
  - Strategy 1: Direct JSON parsing with field name normalization
  - Strategy 2: JSON repair (fixes unescaped newlines, trailing commas, backslashes, field name variations)
  - Strategy 3: Extract JSON from markdown code blocks
  - Strategy 4: Aggressive extraction (find first `{` and last `}`)
  - Strategy 5: Field-by-field extraction (last resort for severely malformed responses)
- **ModelCapabilityRegistry service**: Tracks model JSON output reliability, records parse success/failure rates, and identifies models with known JSON issues.
- **Streaming response validation**: Incremental bracket balance checking during streaming to detect malformed responses early.
- **Error categorization**: Detailed parse error classification (missing_field, invalid_type, malformed_json, schema_mismatch, unknown) with severity levels.
- **Comprehensive test suite**: 51 tests covering JSON repair, code block extraction, field extraction, real-world scenarios (URLs, Markdown, Unicode), and edge cases.

### Changed

- Enhanced prompt templates with stricter JSON formatting requirements and explicit field name specifications.
- Improved `WebLLMProvider.parseResponse()` to use new `ResponseValidator` and telemetry system.
- Added `ResponseValidator` and `ModelCapabilityRegistry` to service exports in `src/core/services/index.ts`.
- Prompt system instruction now explicitly requires lowercase field names and proper newline escaping.

### Fixed

- Improved resilience to model-specific JSON format deviations (corrected_text, correctedText, explanations variations).
- Better handling of malformed JSON from weaker models with fallback to original text.
- Added model capability tracking to enable future intelligent model selection and fallback strategies.

### Dev

- Bumped project version to `0.2.1`.
- All tests passing (51 tests), build succeeds with 0 errors, lint reports 0 errors.

## [0.1.9] - 2026-01-27

### Fixed

- Ensure local UI messages use appropriate alert variants (success/error/info/warning) — `SidePanel` now sets typed `localMessage` variants and `ResultSection` renders correct alert types.
- Clip textarea scrollbars to rounded corners and refactor `TextSection` to use `clsx` for clearer class composition.

### Changed

- Tightened prompt templates to require strict JSON outputs and added few-shot examples to improve small-model output quality.
- Set default inference `temperature` to `0.0` in `WebLLMProvider` for deterministic outputs.

## [0.2.0] - 2026-01-28

### Added

- OCR support using `tesseract.js`: `extractTextFromImage` helper, `useOCR` hook, `ImageUpload` and `OCRProgress` UI components, and `scripts/fetch-tessdata.sh` to prepare Tesseract assets.
- `tesseract.js` dependency and associated `tesseract.js-core` assets are included; core/worker assets are exposed via `web_accessible_resources` in the extension manifest.

### Changed

- Refactored `src/shared/utils/helpers.ts` for clearer Tesseract composition and removed deprecated `worker.load` usage.
- Replaced inline OCR progress UI with an atomic `OCRProgress` component and added `TabSelector`/`ImageUpload` UI for OCR mode in `TextSection`.

### Dev

- Bumped project version to `0.2.0`.

## [0.1.8] - 2026-01-27

### Fixed

- Prevent UI interactions while model is preparing or running — unified `isBusy` across SidePanel controls to disable model selection, style selection, and text editing during model operations.
- Preserve and render array explanations as bulleted lists in `ResultSection`; `WebLLMProvider` now preserves explanation arrays instead of joining them.

### Changed

- Target `ES2022` in `tsconfig.json` to enable modern helpers like `.at()`.
- Refactor: extracted explanation note-append helper in `WebLLMProvider` to improve clarity and avoid duplicate notes.
- Added two extra-fast models to `SUPPORTED_MODELS`: `gemma-2-1.3b-it-q4f16_1-MLC`, `Llama-3.2-1.4B-Instruct-q4f16_1-MLC`.

### Dev

- Bumped package version to `0.1.8`.
- Build completed successfully after changes (webpack warnings about large `webllm.js` bundle remain expected).

## [0.1.7] - 2026-01-27

### Fixed

- **Icon display issue** - Converted extension icons from JPEG to proper PNG format for Chrome compatibility
- Icons now display correctly in Chrome toolbar, extension popup, and chrome://extensions page

## [0.1.6] - 2026-01-27

### Added

- **Toast notification system** - User-friendly error messages displayed in bottom-right corner with 4 variants (success/error/warning/info)
- **Text length validation** - Added `MAX_TEXT_LENGTH` constant (6,000 characters ~1,500 tokens) enforced at all entry points
- **Unit test infrastructure** - Implemented Vitest with React Testing Library, 14 passing tests covering Logger, StorageService, and ProviderFactory
- **Chrome API mocks** - Comprehensive test setup with proper type assertions for storage, runtime, tabs, and other Chrome APIs
- Added `PENDING_ERROR` storage key for error propagation from content script to sidepanel

### Changed

- **Model metadata accuracy** - Verified and corrected all 8 model sizes from HuggingFace manifests:
  - Gemma 2 9B: 5.43GB → 4.84GB
  - Llama 3.1 8B: 5.18GB → 4.31GB
  - Qwen 2.5 7B: 4.43GB → 3.99GB
  - Phi 3.5: 2.31GB → 2.05GB
  - Llama 3.2 3B: 1.93GB → 1.72GB
  - Qwen 2.5 3B: 1.87GB → 1.66GB
  - Gemma 2 2B: 1.57GB → 1.40GB
  - Qwen 2.5 1.5B: 0.93GB → 0.83GB
- **Improved model descriptions** - Aligned with grammar assistant purpose (Pro: complex rewrites, Standard: daily fixes, Flash: quick typos)
- **Memory management** - Refactored ProviderFactory from multi-instance to Single Active Model pattern to prevent GPU memory leaks
- **Environment-aware logging** - Logger now uses DEBUG level in development, INFO in production
- **Error handling** - Enhanced StorageService with QUOTA_BYTES error detection and graceful degradation
- **Type safety improvements** - Fixed `StorageSchema` interface with explicit string literals instead of computed properties
- **Build configuration** - Properly excluded test files from production build in tsconfig.json and webpack.config.js

### Fixed

- **Removed deprecated code** - Cleaned up 60 lines of HTML/CSS injection logic from content script
- **Text overflow validation** - Content script now returns `null` when text exceeds maximum length, triggering proper error flow
- **Background script error routing** - Keyboard shortcut handler properly stores `TOO_LONG` errors and always opens sidepanel
- **SidePanel integration** - Added Toast component with error handling in `usePendingText` and length validation in both manual and auto-run flows
- **TypeScript errors** - Resolved all false positive type errors in test files with proper Chrome API type assertions
- **18 lint warnings** - Fixed unused imports, replaced `any` types with proper types, added missing React Hook dependencies

### Internal

- Added vitest.config.ts with proper React and path alias support
- Added tsconfig.test.json for test-specific TypeScript configuration
- Created src/test/setup.ts with comprehensive Chrome API mocks
- Exported Logger and StorageService classes for testing
- Added `unload()` method to WebLLMProvider for proper cleanup

## [0.1.5] - 2026-01-26

### Added

- Added ARIA labels to all icon-only buttons for better screen reader accessibility
- Added `aria-busy` attribute to download buttons during loading states
- Added `role="status"` and `aria-live="polite"` to download progress for screen reader announcements
- Added responsive correction style selector that shows icon-only view on small screens
- Added selected style name indicator that appears on small screens when button labels are hidden
- Added error logging for auto-run correction failures (previously silent)

### Changed

- **Changed correction style behavior**: Selecting a different style no longer auto-runs AI - users must manually click "RE-CHECK" button
- **More compact UI**: Reduced padding in sidepanel (p-6 → p-4, space-y-6 → space-y-4) and header (px-6 py-5 → px-4 py-3)
- **Updated cache key generation** to include correction style - enables proper stale result detection when style changes
- **Improved Standard style icon**: Changed from Languages to FileCheck for better visual representation
- **Responsive style buttons**: Labels hidden on small screens (≤640px), showing only icons with tooltips
- Enhanced download progress cancelation to prevent UI flashing during model switches

### Fixed

- Fixed download progress block flashing when switching between models
- Fixed cancelled progress state only emitting on explicit user cancellation (not internal operations)
- Fixed excessive cache checking - removed `isBusy` dependency to prevent checks on every state change
- Fixed re-check button not appearing when correction style is changed

## [0.1.4] - 2026-01-26

### Added

- Added loading indicator ("Checking...") while verifying model cache status during model switching
- Added visual feedback for cache validation operations to improve user experience

### Changed

- **Optimized bundle sizes significantly** - Reduced popup.js from 5.6 MiB to 389 KiB (~93% reduction)
  - Implemented code splitting with separate chunks for WebLLM library (5.25 MiB) and vendors (251 KiB)
  - Configured webpack to exclude background and content scripts from splitting for Manifest V3 compliance
  - Extracted WebGPU availability check to shared utilities to reduce duplication
- Improved model switching flow to prevent UI flashing of canceled download states
- Enhanced cache check reliability with immediate progress clearing during model switches
- Optimized model ID normalization with automatic migration for legacy model IDs

### Fixed

- Fixed accidental model deletion bug - Changed cancel download behavior to only cleanup on explicit user cancellation
  - Modified `stopDownload()` to accept `shouldCleanup` parameter (default: false)
  - Ensured model files are only deleted when user clicks "Cancel Operation" button
  - Prevented automatic cleanup during model switching or engine lifecycle management
- Fixed flashing "Download cancelled" message when switching between models
- Fixed focus-visible outline styles across all interactive buttons for better accessibility
- Fixed "Purge All Storage" button visibility - Now always visible regardless of cache state
- Improved model lifecycle management to prevent memory leaks during rapid model switching

### Removed

- Removed confusing TTL-based in-memory cache that caused unnecessary re-downloads
- Removed redundant WebGPU availability checks from WebLLMProvider (now uses shared utility)

## [0.1.3] - 2026-01-26

### Fixed

- Fixed background download processes continuing after cancellation by ensuring engine instances are tracked immediately.
- Improved cancellation robustness in `WebLLMProvider` using immediate promise rejection and tracking.
- Resolved "stuck" UI indicators (Syncing/Processing) by properly handling and propagating aborted execution errors.
- Corrected Gemma model identification by reverting to required lowercase IDs for WebLLM prebuilt compatibility.

## [0.1.2] - 2026-01-26

### Fixed

- Fixed redundant model fetching and weights re-downloading by normalizing model ID casing to match WebLLM expectations.
- Improved model caching reliability by ensuring correct app configuraton usage during cache checks.
- Resolved race conditions in model initialization by delaying engine state updates until loading is complete.
- Optimized UI performance in SidePanel by preventing unnecessary engine resets when switching settings.

## [0.1.1] - 2026-01-26

### Added

- Keyboard shortcut support for running AI corrections (Cmd+Enter on Mac, Ctrl+Enter on Windows/Linux)
- TextButton component for consistent text-only button styling
- Card component now supports actions prop for header buttons
- Added `releases` directory to .gitignore

### Changed

- Moved correction action buttons to card header as icon buttons for cleaner UI
- Reduced card padding for more compact layout (p-5 → p-4, mb-4 → mb-3)
- Reduced button padding across all variants for less bulky appearance
- Made button heights consistent with icon buttons (h-9, h-11, h-14)
- Redesigned Modal component with horizontal layout and improved visual hierarchy
- Updated placeholder text to include keyboard shortcut hints
- Improved button focus ring styles (reduced offset and added transparency)
- All buttons now have explicit cursor-pointer styling

### Fixed

- Fixed side panel not opening on first click from popup button - implemented proper response callbacks
- Fixed focus ring appearing stuck on outline buttons

### Removed

- Cleaned up unused translation keys from en.json (terminate_action, popup.assistant, popup.description, popup.experimental)

## [0.1.0] - 2026-01-26

### Added

- Initial release with local AI-powered grammar correction using WebGPU and WebLLM
- Support for 9 curated AI models across 3 performance tiers (PRO, STANDARD, FLASH)
- 5 writing styles: Standard, Formal, Academic, Simple, and Casual
- Side panel interface for reviewing corrections with detailed AI explanations
- Context menu integration for quick text corrections
- Keyboard shortcut support (Ctrl+Shift+E / Cmd+Shift+E)
- Popup interface with extension overview and quick launch
- Dark mode support across all UI components
- Internationalization support with react-i18next
- Model download progress tracking
- Local model caching in IndexedDB for offline usage
- Privacy-first architecture - all processing happens locally

### Changed

- Organized models into categorized groups in selector dropdown
- Consolidated duplicate popup buttons into single "Launch Assistant" button
- Replaced decorative empty state with functional textarea for direct typing
- Migrated all user-facing strings to translation system

### Removed

- Removed reasoning-heavy models (DeepSeek-R1, Mistral 7B) for faster grammar correction

### Security

- All text processing happens locally - no data sent to external servers
- CSP policy restricts to bundled code only (no remote code execution)
