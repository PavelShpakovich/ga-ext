/**
 * Web Worker for computing text diffs without blocking the main thread
 * Offloads getDiff computation to improve UI responsiveness
 */

import { getDiff, DiffPart } from '@/shared/utils/diff';

export type DiffWorkerRequest = {
  id: string;
  oldText: string;
  newText: string;
};

export type DiffWorkerResponse = {
  id: string;
  result: DiffPart[];
  error?: string;
};

// Handle messages from the main thread
self.addEventListener('message', (event: MessageEvent<DiffWorkerRequest>) => {
  const { id, oldText, newText } = event.data;

  try {
    const result = getDiff(oldText, newText);

    const response: DiffWorkerResponse = {
      id,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: DiffWorkerResponse = {
      id,
      result: [],
      error: error instanceof Error ? error.message : 'Unknown error in diff worker',
    };

    self.postMessage(response);
  }
});
