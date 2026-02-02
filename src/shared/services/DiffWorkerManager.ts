/**
 * DiffWorkerManager
 * Manages Web Worker for computing text diffs without blocking main thread
 * Provides Promise-based API for worker communication
 */

import { DiffPart } from '@/shared/utils/diff';
import type { DiffWorkerRequest, DiffWorkerResponse } from '@/shared/workers/diff.worker';

type PendingRequest = {
  resolve: (result: DiffPart[]) => void;
  reject: (error: Error) => void;
};

export class DiffWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;

  /**
   * Initialize the worker (lazy initialization)
   */
  private ensureWorker(): Worker {
    if (!this.worker) {
      // Worker will be loaded via webpack worker-loader or similar
      this.worker = new Worker(new URL('@/shared/workers/diff.worker.ts', import.meta.url));

      this.worker.addEventListener('message', (event: MessageEvent<DiffWorkerResponse>) => {
        const { id, result, error } = event.data;

        const pending = this.pendingRequests.get(id);
        if (!pending) {
          return;
        }

        this.pendingRequests.delete(id);

        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
      });

      this.worker.addEventListener('error', (error) => {
        console.error('[DiffWorkerManager] Worker error:', error);
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests.entries()) {
          pending.reject(new Error('Worker error'));
          this.pendingRequests.delete(id);
        }
      });
    }

    return this.worker;
  }

  /**
   * Compute diff using Web Worker
   * Falls back to synchronous computation if worker fails
   */
  async computeDiff(oldText: string, newText: string): Promise<DiffPart[]> {
    try {
      const worker = this.ensureWorker();
      const id = `diff-${++this.requestCounter}`;

      const promise = new Promise<DiffPart[]>((resolve, reject) => {
        this.pendingRequests.set(id, { resolve, reject });

        // Set timeout to prevent hanging
        setTimeout(() => {
          if (this.pendingRequests.has(id)) {
            this.pendingRequests.delete(id);
            reject(new Error('Diff computation timeout'));
          }
        }, 5000);
      });

      const request: DiffWorkerRequest = {
        id,
        oldText,
        newText,
      };

      worker.postMessage(request);

      return await promise;
    } catch (error) {
      console.warn('[DiffWorkerManager] Worker failed, falling back to sync computation:', error);
      // Fallback to synchronous computation
      const { getDiff } = await import('@/shared/utils/diff');
      return getDiff(oldText, newText);
    }
  }

  /**
   * Terminate the worker and clean up resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error('Worker terminated'));
      this.pendingRequests.delete(id);
    }
  }
}

// Singleton instance for the entire application
let diffWorkerInstance: DiffWorkerManager | null = null;

/**
 * Get the global DiffWorkerManager instance
 */
export function getDiffWorkerManager(): DiffWorkerManager {
  if (!diffWorkerInstance) {
    diffWorkerInstance = new DiffWorkerManager();
  }
  return diffWorkerInstance;
}

/**
 * Terminate the global worker instance
 */
export function terminateDiffWorker(): void {
  if (diffWorkerInstance) {
    diffWorkerInstance.terminate();
    diffWorkerInstance = null;
  }
}
