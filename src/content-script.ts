console.log('Grammar Assistant: Content script loaded');

// Listen for text selection
let selectedText = '';

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    selectedText = selection.toString().trim();
    console.log('Grammar Assistant: Text selected', { length: selectedText.length });
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Grammar Assistant: Content script received message', message);

  if (message.action === 'getSelectedText') {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
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
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;

  // Handle different input types
  const activeElement = document.activeElement as HTMLElement;

  if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
    // Standard input/textarea
    const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;

    input.value = value.substring(0, start) + newText + value.substring(end);
    input.selectionStart = input.selectionEnd = start + newText.length;

    // Trigger input event for React/Vue
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (activeElement && activeElement.isContentEditable) {
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

  console.log('Grammar Assistant: Text replaced');
}
