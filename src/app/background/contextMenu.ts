/**
 * @module ContextMenu
 * Manages browser context menu (right-click menu) for text correction.
 * Handles menu creation, updates, and internationalization.
 */

import { Logger } from '@/core/services/Logger';
import { Storage } from '@/core/services/StorageService';
import i18n from '@/core/i18n';

const CONTEXT_MENU_ID = 'grammar-assistant-correct';

/**
 * Update the context menu title based on current language settings.
 * Creates the menu item if it doesn't exist yet.
 * @returns Promise that resolves when menu is updated
 */
export async function updateContextMenuTitle(): Promise<void> {
  try {
    const settings = await Storage.getSettings();
    if (i18n.language !== settings.language) {
      await i18n.changeLanguage(settings.language);
    }

    try {
      await chrome.contextMenus.update(CONTEXT_MENU_ID, {
        title: i18n.t('ui.context_menu_title'),
      });
      Logger.debug('ContextMenu', 'Title updated', { language: settings.language });
    } catch (e) {
      // Menu doesn't exist yet, create it
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: i18n.t('ui.context_menu_title'),
        contexts: ['selection'],
      });
      Logger.debug('ContextMenu', 'Created new menu item');
    }
  } catch (error) {
    Logger.error('ContextMenu', 'Failed to update menu title', error);
  }
}

/**
 * Initialize context menu on extension install/update.
 * Ensures language is synced and creates menu with correct title.
 * @returns Promise that resolves when menu is initialized
 */
export async function initializeContextMenu(): Promise<void> {
  const settings = await Storage.getSettings();
  if (i18n.language !== settings.language) {
    await i18n.changeLanguage(settings.language);
  }

  // Clean up and re-create to avoid ID conflicts
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: i18n.t('ui.context_menu_title'),
      contexts: ['selection'],
    });
  });
}
