import { Logger } from './services/Logger';

Logger.info('Background', 'Service worker started');

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  Logger.info('Background', 'Extension installed');

  // Create context menu
  chrome.contextMenus.create({
    id: 'grammar-assistant-correct',
    title: 'Correct with Grammar Assistant',
    contexts: ['selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'grammar-assistant-correct' && tab?.id) {
    const selectedText = info.selectionText || '';
    Logger.debug('Background', 'Context menu clicked', { length: selectedText.length });

    // Open side panel
    chrome.sidePanel.open({ tabId: tab.id });

    // Send selected text to side panel (will be sent when side panel loads)
    chrome.storage.local.set({ pendingText: selectedText });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'correct-text' && tab?.id) {
    Logger.debug('Background', 'Keyboard shortcut triggered');

    // Request selected text from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
      if (response?.text && tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
        chrome.storage.local.set({ pendingText: response.text });
      }
    });
  }
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  Logger.debug('Background', 'Message received', { action: message.action, fromTab: !!sender.tab });

  if (message.action === 'openSidePanel') {
    // If message comes from a tab (content script), use that tab ID
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      if (message.text) {
        chrome.storage.local.set({ pendingText: message.text });
      }
    } else {
      // If message comes from popup, query the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
          if (message.text) {
            chrome.storage.local.set({ pendingText: message.text });
          }
        }
      });
    }
  }

  return true; // Keep channel open for async response
});
