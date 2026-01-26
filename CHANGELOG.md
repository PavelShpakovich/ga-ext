# Changelog

All notable changes to Grammar Assistant will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
