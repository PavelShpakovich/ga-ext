/**
 * @file background/index.ts
 * Chrome Extension Service Worker
 * Orchestrates background modules with optimized lifecycle management.
 *
 * Architecture:
 * - messageHandler: Runtime message routing (OCR, side panel, model downloads)
 * - commandHandler: Keyboard shortcuts and context menu
 * - modelManager: Alarm-based idle timeout and memory pressure handling
 * - contextMenu: Dynamic i18n-aware context menu
 *
 * Performance optimizations:
 * - Modular structure enables lazy loading
 * - chrome.alarms API for reliable timers across service worker restarts
 * - Memory pressure detection for automatic model unloading
 */

import { Logger } from '@/core/services/Logger';
import { STORAGE_KEYS } from '@/core/constants';
import { Storage } from '@/core/services/StorageService';
import i18n from '@/core/i18n';
import { clearStalePending } from '@/shared/utils/pendingStorage';
import { updateContextMenuTitle, initializeContextMenu } from './contextMenu';
import { initializeMessageHandler, initializeContextMenuHandler, initializeKeyboardHandler } from './modules';

Logger.info('Background', 'Service worker started');

// Cleanup any stale payloads on startup (best-effort)
clearStalePending().catch((err) => {
  Logger.warn('Background', 'Failed to clear stale pending payloads on startup', err);
});

// ========================================
// Initialize all modules
// ========================================

// Message routing
initializeMessageHandler();

// Context menu and keyboard shortcuts
initializeContextMenuHandler();
initializeKeyboardHandler();

// ========================================
// Context Menu i18n Setup
// ========================================

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  Logger.info('Background', 'Extension installed');

  await clearStalePending();

  if (i18n.isInitialized) {
    await initializeContextMenu();
  } else {
    i18n.on('initialized', initializeContextMenu);
  }
});

// Watch for settings changes to update context menu title dynamically
Storage.subscribe(STORAGE_KEYS.SETTINGS, async (settings) => {
  if (settings?.language) {
    await i18n.changeLanguage(settings.language);
    try {
      await chrome.contextMenus.update('grammar-assistant-correct', {
        title: i18n.t('ui.context_menu_title'),
      });
      Logger.debug('Background', 'Context menu title updated via storage listener', {
        language: settings.language,
      });
    } catch (e) {
      // Ignore if it doesn't exist yet, it will be created by other paths
    }
  }
});

// Ensure menu title is correct when service worker starts
if (i18n.isInitialized) {
  updateContextMenuTitle();
} else {
  i18n.on('initialized', updateContextMenuTitle);
}

Logger.debug('Background', 'Service worker initialized');
