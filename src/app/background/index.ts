import { Logger } from '@/core/services/Logger';
import { STORAGE_KEYS } from '@/core/constants';
import i18n from '@/core/i18n';

Logger.info('Background', 'Service worker started');

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  Logger.info('Background', 'Extension installed');

  const createMenu = () => {
    chrome.contextMenus.create({
      id: 'grammar-assistant-correct',
      title: i18n.t('ui.context_menu_title'),
      contexts: ['selection'],
    });
  };

  if (i18n.isInitialized) {
    createMenu();
  } else {
    i18n.on('initialized', createMenu);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'grammar-assistant-correct' && tab?.id) {
    const selectedText = info.selectionText || '';
    Logger.debug('Background', 'Context menu clicked', { length: selectedText.length });

    // Open side panel
    chrome.sidePanel.open({ tabId: tab.id });

    // Send selected text to side panel and flag auto-correct
    chrome.storage.local.set({
      [STORAGE_KEYS.PENDING_TEXT]: selectedText,
      [STORAGE_KEYS.PENDING_AUTO_CORRECT]: true,
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'correct-text' && tab?.id) {
    Logger.debug('Background', 'Keyboard shortcut triggered');

    // Request selected text from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
      // Always open SidePanel for better UX, even if no text selected
      if (tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
      }

      if (response?.error === 'TOO_LONG') {
        Logger.debug('Background', 'Text too long, sending error to SidePanel');
        chrome.storage.local.set({
          [STORAGE_KEYS.PENDING_ERROR]: 'TOO_LONG',
        });
        return;
      }

      const text = response?.text;

      if (text) {
        chrome.storage.local.set({
          [STORAGE_KEYS.PENDING_TEXT]: text,
          [STORAGE_KEYS.PENDING_AUTO_CORRECT]: true,
        });
      } else {
        // Optional: Could send a message to the sidepanel to show "Select text first" hint
        Logger.debug('Background', 'No text selected from content script', response);
      }
    });
  }
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Logger.debug('Background', 'Message received', { action: message.action, fromTab: !!sender.tab });

  if (message.action === 'openSidePanel') {
    // If message comes from a tab (content script), use that tab ID
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      if (message.text !== undefined) {
        chrome.storage.local.set({
          [STORAGE_KEYS.PENDING_TEXT]: message.text,
          [STORAGE_KEYS.PENDING_AUTO_CORRECT]: !!message.autoRun,
        });
      }
      sendResponse({ success: true });
    } else {
      // If message comes from popup, query the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
          if (message.text !== undefined) {
            chrome.storage.local.set({
              [STORAGE_KEYS.PENDING_TEXT]: message.text,
              [STORAGE_KEYS.PENDING_AUTO_CORRECT]: !!message.autoRun,
            });
          }
        }
        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response
    }
  }

  if (message.action === 'startModelDownload') {
    const modelId = message.modelId as string | undefined;
    if (!modelId) return true;

    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      chrome.storage.local.set({ [STORAGE_KEYS.PENDING_MODEL_DOWNLOAD]: modelId });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
          chrome.storage.local.set({ [STORAGE_KEYS.PENDING_MODEL_DOWNLOAD]: modelId });
        }
      });
    }
  }

  return true; // Keep channel open for async response
});
