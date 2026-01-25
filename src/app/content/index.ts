import { Logger } from '@/core/services/Logger';

Logger.info('ContentScript', 'Content script loaded');

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

const getActiveSelectionText = (): string => {
  const selection = window.getSelection();
  const selectionText = selection?.toString().trim() || '';

  if (selectionText) {
    // If we have a selection, update the range tracker
    if (selection && selection.rangeCount > 0) {
      // track selection range if needed
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
    return activeElement.innerText.trim();
  }

  return '';
};

const updateSelectedText = () => {
  const selection = window.getSelection();
  const activeElement = getDeepActiveElement() as HTMLElement;

  if (activeElement && activeElement !== document.body) {
    lastInteractedElement = activeElement;
  }

  // Track standard inputs
  if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
    // track input selection if needed
  } else if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
    // Track DOM selection (including contenteditable)
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
    sendResponse({ text });
  }

  return true;
});
