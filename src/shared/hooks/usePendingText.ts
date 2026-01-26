import { useEffect } from 'react';
import { STORAGE_KEYS } from '@/core/constants';

export const usePendingText = (
  onTextReceived: (text: string, options?: { autoRun?: boolean }) => void,
  onErrorReceived?: (error: string) => void,
) => {
  useEffect(() => {
    chrome.storage.local.get(
      [STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT, STORAGE_KEYS.PENDING_ERROR],
      (result) => {
        const text = result[STORAGE_KEYS.PENDING_TEXT];
        const error = result[STORAGE_KEYS.PENDING_ERROR];
        const autoRun = !!result[STORAGE_KEYS.PENDING_AUTO_CORRECT];

        if (typeof text === 'string') {
          onTextReceived(text, { autoRun });
          chrome.storage.local.remove([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT]);
        }

        if (typeof error === 'string' && onErrorReceived) {
          onErrorReceived(error);
          chrome.storage.local.remove(STORAGE_KEYS.PENDING_ERROR);
        }
      },
    );

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const textChange = changes[STORAGE_KEYS.PENDING_TEXT];
      if (textChange && typeof textChange.newValue === 'string') {
        const autoRun = !!changes[STORAGE_KEYS.PENDING_AUTO_CORRECT]?.newValue;
        onTextReceived(textChange.newValue, { autoRun });
        chrome.storage.local.remove([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT]);
      }

      const errorChange = changes[STORAGE_KEYS.PENDING_ERROR];
      if (errorChange && typeof errorChange.newValue === 'string' && onErrorReceived) {
        onErrorReceived(errorChange.newValue);
        chrome.storage.local.remove(STORAGE_KEYS.PENDING_ERROR);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [onTextReceived, onErrorReceived]);
};
