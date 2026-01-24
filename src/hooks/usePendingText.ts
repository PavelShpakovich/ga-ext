import { useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';

export const usePendingText = (onTextReceived: (text: string, options?: { autoRun?: boolean }) => void) => {
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT], (result) => {
      const text = result[STORAGE_KEYS.PENDING_TEXT];
      const autoRun = !!result[STORAGE_KEYS.PENDING_AUTO_CORRECT];
      if (text) {
        onTextReceived(text as string, { autoRun });
        chrome.storage.local.remove([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT]);
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const change = changes[STORAGE_KEYS.PENDING_TEXT];
      if (change?.newValue) {
        const autoRun = !!changes[STORAGE_KEYS.PENDING_AUTO_CORRECT]?.newValue;
        onTextReceived(change.newValue as string, { autoRun });
        chrome.storage.local.remove([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT]);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [onTextReceived]);
};
