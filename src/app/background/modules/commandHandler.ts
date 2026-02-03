/**
 * @module CommandHandler
 * Handles keyboard shortcuts and context menu clicks.
 * Separated for better organization and potential lazy loading.
 */

import { Logger } from '@/core/services/Logger';
import { setPendingText, setPendingError } from '@/shared/utils/pendingStorage';
import { MessageAction } from '@/shared/types';

/**
 * Handle context menu click events
 */
export function initializeContextMenuHandler(): void {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'grammar-assistant-correct' && tab?.id) {
      const selectedText = info.selectionText || '';
      Logger.debug('CommandHandler', 'Context menu clicked', { length: selectedText.length });

      // Open side panel
      chrome.sidePanel.open({ tabId: tab.id });

      // Send selected text to side panel and flag auto-correct
      await setPendingText(selectedText, true);
    }
  });

  Logger.debug('CommandHandler', 'Context menu handler initialized');
}

/**
 * Handle keyboard shortcut commands
 */
export function initializeKeyboardHandler(): void {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === 'correct-text' && tab?.id) {
      Logger.debug('CommandHandler', 'Keyboard shortcut triggered');

      // Request selected text from content script
      chrome.tabs.sendMessage(tab.id, { action: MessageAction.GET_SELECTED_TEXT }, async (response) => {
        // Always open SidePanel for better UX, even if no text selected
        if (tab.id) {
          chrome.sidePanel.open({ tabId: tab.id });
        }

        if (response?.error === 'TOO_LONG') {
          Logger.debug('CommandHandler', 'Text too long, sending error to SidePanel');
          await setPendingError('TOO_LONG');
          return;
        }

        const text = response?.text;
        if (text) {
          await setPendingText(text, true);
        } else {
          Logger.debug('CommandHandler', 'No text selected from content script', response);
        }
      });
    }
  });

  Logger.debug('CommandHandler', 'Keyboard handler initialized');
}
