import { useEffect } from 'react';

export const usePendingText = (onTextReceived: (text: string) => void) => {
  useEffect(() => {
    chrome.storage.local.get(['pendingText'], (result) => {
      if (result.pendingText) {
        onTextReceived(result.pendingText);
        chrome.storage.local.remove(['pendingText']);
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.pendingText?.newValue) {
        onTextReceived(changes.pendingText.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [onTextReceived]);
};
