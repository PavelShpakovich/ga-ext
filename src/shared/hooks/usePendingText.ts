import { useEffect } from 'react';
import { STORAGE_KEYS } from '@/core/constants';
import { Storage } from '@/core/services/StorageService';

export const usePendingText = (
  onTextReceived: (text: string, options?: { autoRun?: boolean }) => void,
  onErrorReceived?: (error: string) => void,
) => {
  useEffect(() => {
    // Initial check
    const checkPending = async () => {
      const text = await Storage.get(STORAGE_KEYS.PENDING_TEXT);
      const error = await Storage.get(STORAGE_KEYS.PENDING_ERROR);
      const autoRun = !!(await Storage.get(STORAGE_KEYS.PENDING_AUTO_CORRECT));

      if (typeof text === 'string') {
        onTextReceived(text, { autoRun });
        await Storage.remove([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT]);
      }

      if (typeof error === 'string' && onErrorReceived) {
        onErrorReceived(error);
        await Storage.remove(STORAGE_KEYS.PENDING_ERROR);
      }
    };

    checkPending();

    const unsubText = Storage.subscribe(STORAGE_KEYS.PENDING_TEXT, async (newText) => {
      if (typeof newText === 'string') {
        const autoRun = !!(await Storage.get(STORAGE_KEYS.PENDING_AUTO_CORRECT));
        onTextReceived(newText, { autoRun });
        await Storage.remove([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_AUTO_CORRECT]);
      }
    });

    const unsubError = Storage.subscribe(STORAGE_KEYS.PENDING_ERROR, async (newError) => {
      if (typeof newError === 'string' && onErrorReceived) {
        onErrorReceived(newError);
        await Storage.remove(STORAGE_KEYS.PENDING_ERROR);
      }
    });

    return () => {
      unsubText();
      unsubError();
    };
  }, [onTextReceived, onErrorReceived]);
};
