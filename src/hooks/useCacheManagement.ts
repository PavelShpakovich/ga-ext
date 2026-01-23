import { useState, useEffect } from 'react';
import { WebLLMProvider } from '../providers/WebLLMProvider';

export const useCacheManagement = () => {
  const [cacheSize, setCacheSize] = useState<string>('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    updateCacheSize();
  }, []);

  const updateCacheSize = async () => {
    try {
      const { size, databases } = await WebLLMProvider.getCacheSize();
      if (size > 0) {
        const sizeGB = (size / (1024 * 1024 * 1024)).toFixed(2);
        setCacheSize(`${sizeGB} GB (${databases.length} databases)`);
      } else {
        setCacheSize('No cache');
      }
    } catch {
      setCacheSize('Unknown');
    }
  };

  const clearCache = async () => {
    if (!confirm('Clear all cached models? You will need to re-download models next time.')) {
      return false;
    }

    setIsClearing(true);
    setClearSuccess(false);

    try {
      await WebLLMProvider.clearCache();
      await updateCacheSize();
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
      return false;
    } finally {
      setIsClearing(false);
    }
  };

  return { cacheSize, isClearing, clearSuccess, clearCache };
};
