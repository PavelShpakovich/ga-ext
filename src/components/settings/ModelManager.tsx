import React, { useState, useEffect } from 'react';
import { Download, Trash2, Check, HardDrive, Zap } from 'lucide-react';
import { Section, Badge } from '../ui';
import { Button } from '../Button';
import { WebLLMProvider } from '../../providers/WebLLMProvider';
import { Logger } from '../../services/Logger';

interface ModelManagerProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onSettingsClose?: () => void;
}

interface ModelInfo {
  id: string;
  name: string;
  family: string;
  size: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  isCached: boolean;
}

export const ModelManager: React.FC<ModelManagerProps> = ({ selectedModel, onModelChange, onSettingsClose }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [cachedModelIds, setCachedModelIds] = useState<string[]>([]);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string>('all');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    const allModels = WebLLMProvider.getAvailableModels();
    const cached = await WebLLMProvider.getCachedModels();
    setCachedModelIds(cached);

    Logger.debug('ModelManager', 'Loading models', {
      totalModels: allModels.length,
      cachedModels: cached.length,
      cachedIds: cached,
    });

    // Merge cached info with model list
    const modelsWithCache = allModels.map((m) => {
      // Check if this model is in cache
      const isCached = cached.some((cachedName) => {
        // Exact match
        if (m.id === cachedName) return true;

        // Case-insensitive match
        if (m.id.toLowerCase() === cachedName.toLowerCase()) return true;

        // WebLLM format: model IDs in our list vs database names are the same
        // e.g., "Llama-3.2-1B-Instruct-q4f16_1-MLC-1k"
        return false;
      });

      return {
        ...m,
        isCached,
      };
    });

    setModels(modelsWithCache);
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm(`Delete ${modelId}? You'll need to re-download it next time.`)) {
      return;
    }

    setDeletingModel(modelId);
    try {
      await WebLLMProvider.deleteModel(modelId);
      await loadModels(); // Refresh the list
    } catch (error) {
      Logger.error('ModelManager', 'Failed to delete model', { modelId, error });
      alert('Failed to delete model. Please try again.');
    } finally {
      setDeletingModel(null);
    }
  };

  const families = ['all', ...Array.from(new Set(models.map((m) => m.family)))];
  const filteredModels = selectedFamily === 'all' ? models : models.filter((m) => m.family === selectedFamily);

  const cachedModels = filteredModels.filter((m) => m.isCached);
  const availableModels = filteredModels.filter((m) => !m.isCached);

  const getSpeedBadge = (speed: 'fast' | 'medium' | 'slow') => {
    const variants: Record<typeof speed, 'success' | 'warning' | 'default'> = {
      fast: 'success',
      medium: 'warning',
      slow: 'default',
    };
    return <Badge variant={variants[speed]}>{speed}</Badge>;
  };

  return (
    <Section title='Model Management'>
      {/* Summary Card */}
      {cachedModels.length > 0 && (
        <div className='mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <HardDrive className='w-4 h-4 text-blue-600 dark:text-blue-400' />
              <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                {cachedModels.length} {cachedModels.length === 1 ? 'Model' : 'Models'} Cached
              </span>
            </div>
            <Badge variant='success' className='text-[10px]'>
              Ready
            </Badge>
          </div>
        </div>
      )}

      {/* Family Filter */}
      <div className='flex gap-2 mb-4 overflow-x-auto pb-2'>
        {families.map((family) => (
          <button
            key={family}
            onClick={() => setSelectedFamily(family)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedFamily === family
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {family === 'all' ? 'All Models' : family}
          </button>
        ))}
      </div>

      {/* Installed Models */}
      {cachedModels.length > 0 ? (
        <div className='mb-4'>
          <h4 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2'>
            <Check className='w-3.5 h-3.5 text-green-600' />
            Installed ({cachedModels.length})
          </h4>
          <div className='space-y-2 max-h-48 overflow-y-auto pr-1'>
            {cachedModels.map((model) => (
              <div
                key={model.id}
                className={`p-3 rounded-lg border transition-all ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <button
                        onClick={() => {
                          onModelChange(model.id);
                          onSettingsClose?.();
                        }}
                        className='text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 text-left truncate'
                      >
                        {model.name}
                      </button>
                      {selectedModel === model.id && (
                        <Badge variant='primary' className='text-[10px] px-1.5 py-0'>
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2'>
                      <span>{model.size}</span>
                      <span>•</span>
                      {getSpeedBadge(model.speed)}
                    </div>
                    <p className='text-xs text-gray-600 dark:text-gray-400'>{model.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteModel(model.id)}
                    disabled={deletingModel === model.id || selectedModel === model.id}
                    className='shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    title={selectedModel === model.id ? 'Cannot delete active model' : 'Delete model'}
                  >
                    {deletingModel === model.id ? (
                      <div className='w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin' />
                    ) : (
                      <Trash2 className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='mb-4 p-3 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700'>
          <HardDrive className='w-6 h-6 text-gray-400 dark:text-gray-600 mx-auto mb-2' />
          <p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>No models installed yet</p>
          <p className='text-xs text-gray-500 dark:text-gray-500'>Select a model below to download and start using</p>
        </div>
      )}

      {/* Available Models */}
      {availableModels.length > 0 && (
        <div>
          <h4 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2'>
            <Download className='w-3.5 h-3.5' />
            Available to Download ({availableModels.length})
          </h4>
          <div className='space-y-2 max-h-60 overflow-y-auto pr-1'>
            {availableModels.map((model) => (
              <div
                key={model.id}
                className='p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <h5 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 truncate'>{model.name}</h5>
                    <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2'>
                      <span>{model.size}</span>
                      <span>•</span>
                      {getSpeedBadge(model.speed)}
                    </div>
                    <p className='text-xs text-gray-600 dark:text-gray-400'>{model.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      onModelChange(model.id);
                      onSettingsClose?.();
                    }}
                    className='shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors'
                    title='Use this model'
                  >
                    <Download className='w-4 h-4' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
        <div className='flex gap-2'>
          <Zap className='w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5' />
          <p className='text-xs text-blue-700 dark:text-blue-300'>
            Models are downloaded once and cached locally. First use will take 2-10 minutes depending on size.
          </p>
        </div>
      </div>
    </Section>
  );
};
