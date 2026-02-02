import { Logger } from '@/core/services/Logger';
import { STORAGE_KEYS } from '@/core/constants';
import { Storage } from '@/core/services/StorageService';
import i18n from '@/core/i18n';
import { setPendingText, setPendingError, clearStalePending } from '@/shared/utils/pendingStorage';
import { updateContextMenuTitle, initializeContextMenu } from './contextMenu';

Logger.info('Background', 'Service worker started');

// Cleanup any stale payloads on startup (best-effort)
clearStalePending().catch((err) => {
  Logger.warn('Background', 'Failed to clear stale pending payloads on startup', err);
});

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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'grammar-assistant-correct' && tab?.id) {
    const selectedText = info.selectionText || '';
    Logger.debug('Background', 'Context menu clicked', { length: selectedText.length });

    // Open side panel
    chrome.sidePanel.open({ tabId: tab.id });

    // Send selected text to side panel and flag auto-correct
    await setPendingText(selectedText, true);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'correct-text' && tab?.id) {
    Logger.debug('Background', 'Keyboard shortcut triggered');

    // Request selected text from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, async (response) => {
      // Always open SidePanel for better UX, even if no text selected
      if (tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
      }

      if (response?.error === 'TOO_LONG') {
        Logger.debug('Background', 'Text too long, sending error to SidePanel');
        await setPendingError('TOO_LONG');
        return;
      }

      const text = response?.text;

      if (text) {
        await setPendingText(text, true);
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

  if (message.action === 'run-ocr') {
    (async () => {
      try {
        await setupOffscreen();
        const response = await chrome.runtime.sendMessage({
          action: 'ocr',
          image: message.image,
          language: message.language,
        });
        sendResponse(response);
      } catch (error) {
        Logger.error('Background', 'OCR through offscreen failed', error);
        sendResponse({ error: (error as Error).message });
      }
    })();
    return true;
  }

  if (message.action === 'openSidePanel') {
    // If message comes from a tab (content script), use that tab ID
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      if (message.text !== undefined) {
        setPendingText(message.text, !!message.autoRun).then(() => {
          sendResponse({ success: true });
        });
        return true;
      }
      sendResponse({ success: true });
    } else {
      // If message comes from popup, query the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
          if (message.text !== undefined) {
            setPendingText(message.text, !!message.autoRun).then(() => {
              sendResponse({ success: true });
            });
            return true;
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
      Storage.set(STORAGE_KEYS.PENDING_MODEL_DOWNLOAD, modelId);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
          Storage.set(STORAGE_KEYS.PENDING_MODEL_DOWNLOAD, modelId);
        }
      });
    }
  }

  return true; // Keep channel open for async response
});

async function setupOffscreen() {
  const OFFSCREEN_PATH = 'offscreen.html';

  if (await chrome.offscreen.hasDocument()) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.DOM_PARSER],
    justification: 'Perform OCR tasks using Tesseract.js in a background-like environment',
  });
}
