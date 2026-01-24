import { Logger } from './services/Logger';

Logger.info('ContentScript', 'Content script loaded');

// Listen for text selection
let selectedText = '';

const getActiveSelectionText = (): string => {
  const selection = window.getSelection();
  const selectionText = selection?.toString().trim() || '';
  if (selectionText) {
    return selectionText;
  }

  const activeElement = document.activeElement as HTMLElement | null;
  if (!activeElement) return '';

  if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
    const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start !== end) {
      return input.value.substring(start, end).trim();
    }
  }

  return '';
};

const updateSelectedText = () => {
  const nextText = getActiveSelectionText();
  if (nextText && nextText !== selectedText) {
    selectedText = nextText;
    Logger.debug('ContentScript', 'Text selected', { length: selectedText.length });
  }
};

document.addEventListener('selectionchange', updateSelectedText);
document.addEventListener('mouseup', updateSelectedText);
document.addEventListener('keyup', updateSelectedText);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Logger.debug('ContentScript', 'Received message', { action: message.action });

  if (message.action === 'getSelectedText') {
    const text = getActiveSelectionText();
    sendResponse({ text });
  }

  if (message.action === 'replaceText') {
    replaceSelectedText(message.text);
    sendResponse({ success: true });
  }

  return true;
});

// Replace selected text in DOM
function replaceSelectedText(newText: string): void {
  // Handle different input types
  const activeElement = document.activeElement as HTMLElement | null;

  if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
    // Standard input/textarea
    const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const value = input.value;

    input.value = value.substring(0, start) + newText + value.substring(end);
    input.selectionStart = input.selectionEnd = start + newText.length;

    // Trigger input event for React/Vue
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    Logger.info('ContentScript', 'Text replaced', { length: newText.length, target: activeElement.tagName });
    return;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    if (activeElement && activeElement.isContentEditable) {
      const existing = activeElement.textContent || '';
      activeElement.textContent = `${existing}${newText}`;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      Logger.info('ContentScript', 'Text replaced (contenteditable append)', { length: newText.length });
    }
    return;
  }

  const range = selection.getRangeAt(0);

  if (activeElement && activeElement.isContentEditable) {
    // ContentEditable elements
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));

    // Move cursor to end of inserted text
    range.setStart(range.endContainer, range.endOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger input event
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // Fallback: just replace text in range
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));
  }

  Logger.info('ContentScript', 'Text replaced', { length: newText.length });
}
