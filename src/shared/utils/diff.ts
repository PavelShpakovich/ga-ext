// Simple word-based diff implementation to avoid external dependencies
// Highlights additions and deletions between two strings

export type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

/**
 * Computes a simple word-level diff between two strings.
 * This is a basic implementation and might not be as robust as a full LCS algorithm,
 * but it works for showing simple grammar improvements.
 */
export function getDiff(oldStr: string, newStr: string): DiffPart[] {
  const oldWords = oldStr.split(/(\s+)/).filter(Boolean);
  const newWords = newStr.split(/(\s+)/).filter(Boolean);

  const result: DiffPart[] = [];
  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    // If we've run out of old words, the rest are added
    if (oldIdx >= oldWords.length) {
      result.push({ value: newWords.slice(newIdx).join(''), added: true });
      break;
    }

    // If we've run out of new words, the rest are removed
    if (newIdx >= newWords.length) {
      result.push({ value: oldWords.slice(oldIdx).join(''), removed: true });
      break;
    }

    if (oldWords[oldIdx] === newWords[newIdx]) {
      // Identity
      result.push({ value: oldWords[oldIdx] });
      oldIdx++;
      newIdx++;
    } else {
      // Difference found. Look ahead to find a match and sync up.
      let foundMatch = false;

      // Look ahead in newWords for the current oldWord
      for (let i = newIdx + 1; i < Math.min(newIdx + 5, newWords.length); i++) {
        if (newWords[i] === oldWords[oldIdx]) {
          // Found current oldWord further ahead in newWords -> items in between are additions
          result.push({ value: newWords.slice(newIdx, i).join(''), added: true });
          newIdx = i;
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Look ahead in oldWords for the current newWord
        for (let j = oldIdx + 1; j < Math.min(oldIdx + 5, oldWords.length); j++) {
          if (oldWords[j] === newWords[newIdx]) {
            // Found current newWord further ahead in oldWords -> items in between are removals
            result.push({ value: oldWords.slice(oldIdx, j).join(''), removed: true });
            oldIdx = j;
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        // Just treat these as one removal and one addition
        result.push({ value: oldWords[oldIdx], removed: true });
        result.push({ value: newWords[newIdx], added: true });
        oldIdx++;
        newIdx++;
      }
    }
  }

  // Combine consecutive similar types
  const finalResult: DiffPart[] = [];
  for (const part of result) {
    const last = finalResult[finalResult.length - 1];
    if (last && last.added === part.added && last.removed === part.removed) {
      last.value += part.value;
    } else {
      finalResult.push(part);
    }
  }

  return finalResult;
}
