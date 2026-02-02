/**
 * useDiff hook
 * Provides diff computation using Web Worker for better UI responsiveness
 */

import { useState, useEffect } from 'react';
import { DiffPart } from '@/shared/utils/diff';
import { getDiffWorkerManager } from '@/shared/services/DiffWorkerManager';

export function useDiff(oldText: string, newText: string): DiffPart[] {
  const [diffParts, setDiffParts] = useState<DiffPart[]>([]);

  useEffect(() => {
    let cancelled = false;

    const computeDiff = async () => {
      try {
        const manager = getDiffWorkerManager();
        const result = await manager.computeDiff(oldText, newText);

        if (!cancelled) {
          setDiffParts(result);
        }
      } catch (error) {
        console.error('[useDiff] Error computing diff:', error);
        // On error, show unchanged text
        if (!cancelled) {
          setDiffParts([{ value: newText }]);
        }
      }
    };

    computeDiff();

    return () => {
      cancelled = true;
    };
  }, [oldText, newText]);

  return diffParts;
}
