import { Logger } from '@/core/services/Logger';
import { MAX_TEXT_LENGTH } from '@/core/constants';

// Prevent multiple initializations in case of re-injection
if ((window as any).__GA_CONTENT_SCRIPT_LOADED__) {
  Logger.debug('ContentScript', 'Already loaded, skipping initialization');
} else {
  (window as any).__GA_CONTENT_SCRIPT_LOADED__ = true;
  Logger.info('ContentScript', 'Content script loaded');
}

// Listen for text selection
let lastInteractedElement: HTMLElement | null = null;

const getDeepActiveElement = (root: Document | ShadowRoot = document): Element | null => {
  const activeEl = root.activeElement;
  if (!activeEl) return null;
  if (activeEl.shadowRoot) {
    return getDeepActiveElement(activeEl.shadowRoot) || activeEl;
  }
  return activeEl;
};

const getActiveSelectionText = (): string | null => {
  const selection = window.getSelection();
  const selectionText = selection?.toString().trim() || '';

  if (selectionText) {
    if (selectionText.length > MAX_TEXT_LENGTH) {
      Logger.warn('ContentScript', 'Selected text too long.');
      return null;
    }
    return selectionText;
  }

  const activeElement = (getDeepActiveElement() as HTMLElement) || lastInteractedElement;
  if (!activeElement) return '';

  if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
    const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start !== end) {
      return input.value.substring(start, end).trim();
    }
  }

  // Handle contenteditable if no text is explicitly selected but element is focused
  if (activeElement.isContentEditable) {
    lastInteractedElement = activeElement;
    const text = activeElement.innerText.trim();

    // Safety check: Prevent accidental processing of huge documents
    // If text is larger than limits, require user to select smaller chunk
    if (text.length > MAX_TEXT_LENGTH) {
      Logger.warn('ContentScript', 'Text too long for auto-selection.');
      return null;
    }
    return text;
  }

  return '';
};

const updateSelectedText = () => {
  const activeElement = getDeepActiveElement() as HTMLElement;

  if (activeElement && activeElement !== document.body) {
    lastInteractedElement = activeElement;
  }
};

document.addEventListener('selectionchange', updateSelectedText);
document.addEventListener('mouseup', updateSelectedText);
document.addEventListener('keyup', updateSelectedText);
document.addEventListener('focusin', (e) => {
  const target = e.target as HTMLElement;
  if (target && target !== document.body) {
    lastInteractedElement = target;
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Logger.debug('ContentScript', 'Received message', { action: message.action });

  if (message.action === 'getSelectedText') {
    const text = getActiveSelectionText();
    if (text === null) {
      sendResponse({ error: 'TOO_LONG' });
    } else {
      sendResponse({ text });
    }
  }

  return true;
});
null;
