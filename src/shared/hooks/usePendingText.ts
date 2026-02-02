import { useEffect } from 'react';
import { STORAGE_KEYS } from '@/core/constants';
import {
  getSessionStorage,
  isPayloadExpired,
  isPendingTextPayload,
  isPendingErrorPayload,
  type PendingTextPayload,
  type PendingErrorPayload,
} from '@/shared/utils/pendingStorage';

export const usePendingText = (
  onTextReceived: (text: string, options?: { autoRun?: boolean }) => void,
  onErrorReceived?: (error: string) => void,
) => {
  useEffect(() => {
    const pendingStorage = getSessionStorage();

    // Initial check
    const checkPending = async () => {
      const result = await pendingStorage.get([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_ERROR]);
      const textPayload = result[STORAGE_KEYS.PENDING_TEXT] as PendingTextPayload | string | undefined;
      const errorPayload = result[STORAGE_KEYS.PENDING_ERROR] as PendingErrorPayload | string | undefined;

      // Guard against empty results
      if (!textPayload && !errorPayload) return;

      if (typeof textPayload === 'string') {
        onTextReceived(textPayload, { autoRun: true });
        await pendingStorage.remove([STORAGE_KEYS.PENDING_TEXT]);
      } else if (isPendingTextPayload(textPayload)) {
        if (!isPayloadExpired(textPayload.ts)) {
          onTextReceived(textPayload.value, { autoRun: !!textPayload.autoRun });
        }
        await pendingStorage.remove([STORAGE_KEYS.PENDING_TEXT]);
      }

      if (typeof errorPayload === 'string' && onErrorReceived) {
        onErrorReceived(errorPayload);
        await pendingStorage.remove(STORAGE_KEYS.PENDING_ERROR);
      } else if (onErrorReceived && isPendingErrorPayload(errorPayload)) {
        if (!isPayloadExpired(errorPayload.ts)) {
          onErrorReceived(errorPayload.value);
        }
        await pendingStorage.remove(STORAGE_KEYS.PENDING_ERROR);
      }
    };

    checkPending();

    const handleChange = async (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'session' && areaName !== 'local') return;

      const pendingTextChange = changes[STORAGE_KEYS.PENDING_TEXT];
      if (pendingTextChange?.newValue) {
        const payload = pendingTextChange.newValue as PendingTextPayload | string;
        if (typeof payload === 'string') {
          onTextReceived(payload, { autoRun: true });
        } else if (isPendingTextPayload(payload) && !isPayloadExpired(payload.ts)) {
          onTextReceived(payload.value, { autoRun: !!payload.autoRun });
        }
        await pendingStorage.remove([STORAGE_KEYS.PENDING_TEXT]);
      }

      const pendingErrorChange = changes[STORAGE_KEYS.PENDING_ERROR];
      if (pendingErrorChange?.newValue && onErrorReceived) {
        const payload = pendingErrorChange.newValue as PendingErrorPayload | string;
        if (typeof payload === 'string') {
          onErrorReceived(payload);
        } else if (isPendingErrorPayload(payload) && !isPayloadExpired(payload.ts)) {
          onErrorReceived(payload.value);
        }
        await pendingStorage.remove(STORAGE_KEYS.PENDING_ERROR);
      }
    };

    chrome.storage.onChanged.addListener(handleChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleChange);
    };
  }, [onTextReceived, onErrorReceived]);
};
