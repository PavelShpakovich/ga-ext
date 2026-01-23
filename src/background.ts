console.log('Grammar Assistant: Background service worker started');

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Grammar Assistant: Extension installed');

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
    console.log('Grammar Assistant: Context menu clicked', { selectedText });

    // Open side panel
    chrome.sidePanel.open({ tabId: tab.id });

    // Send selected text to side panel (will be sent when side panel loads)
    chrome.storage.local.set({ pendingText: selectedText });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'correct-text' && tab?.id) {
    console.log('Grammar Assistant: Keyboard shortcut triggered');

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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Grammar Assistant: Message received', { message, sender });

  if (message.action === 'openSidePanel') {
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      if (message.text) {
        chrome.storage.local.set({ pendingText: message.text });
      }
    }
  }

  return true; // Keep channel open for async response
});
