/**
 * @module MessageHandler
 * Handles all runtime message routing for the background service worker.
 * Separated into its own module for better organization and lazy loading.
 */

import { Logger } from '@/core/services/Logger';
import { STORAGE_KEYS } from '@/core/constants';
import { Storage } from '@/core/services/StorageService';
import { setPendingText } from '@/shared/utils/pendingStorage';

/**
 * Setup offscreen document for OCR processing
 */
async function setupOffscreen(): Promise<void> {
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

/**
 * Handle OCR request message
 */
async function handleOCRRequest(
  message: { image: string; language: string },
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    await setupOffscreen();
    const response = await chrome.runtime.sendMessage({
      action: 'ocr',
      image: message.image,
      language: message.language,
    });
    sendResponse(response);
  } catch (error) {
    Logger.error('MessageHandler', 'OCR through offscreen failed', error);
    sendResponse({ error: (error as Error).message });
  }
}

/**
 * Handle side panel open request
 */
async function handleOpenSidePanel(
  message: { text?: string; autoRun?: boolean },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: { success: boolean }) => void,
): Promise<boolean> {
  // If message comes from a tab (content script), use that tab ID
  if (sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    if (message.text !== undefined) {
      await setPendingText(message.text, !!message.autoRun);
      sendResponse({ success: true });
      return true;
    }
    sendResponse({ success: true });
    return false;
  }

  // If message comes from popup, query the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]?.id) {
      chrome.sidePanel.open({ tabId: tabs[0].id });
      if (message.text !== undefined) {
        await setPendingText(message.text, !!message.autoRun);
      }
    }
    sendResponse({ success: true });
  });
  return true; // Keep channel open for async response
}

/**
 * Handle model download initiation
 */
function handleModelDownload(message: { modelId?: string }, sender: chrome.runtime.MessageSender): void {
  const modelId = message.modelId;
  if (!modelId) return;

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

/**
 * Initialize message listener for runtime messages
 */
export function initializeMessageHandler(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Logger.debug('MessageHandler', 'Message received', {
      action: message.action,
      fromTab: !!sender.tab,
    });

    // OCR requests
    if (message.action === 'run-ocr') {
      handleOCRRequest(message, sendResponse);
      return true; // Keep channel open for async response
    }

    // Side panel requests
    if (message.action === 'openSidePanel') {
      handleOpenSidePanel(message, sender, sendResponse);
      return true;
    }

    // Model download requests
    if (message.action === 'startModelDownload') {
      handleModelDownload(message, sender);
      return true;
    }

    return false;
  });

  Logger.debug('MessageHandler', 'Message handler initialized');
}
