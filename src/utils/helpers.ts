export const generateCacheKey = (modelId: string, text: string): string => {
  return `${modelId}::${text.trim()}`;
};

export const normalizeDownloadProgress = (progress: number): number => {
  return Math.max(0, Math.min(1, progress));
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
