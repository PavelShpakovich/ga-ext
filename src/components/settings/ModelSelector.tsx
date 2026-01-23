import React from 'react';
import { Select, Badge, ModelInfoCard } from '../ui';

interface ModelSelectorProps {
  selectedModel: string;
  selectGroups: Array<{ label: string; options: Array<{ value: string; label: string }> }>;
  modelInfo: { family: string; speed: 'fast' | 'medium' | 'slow'; size: string; description: string } | undefined;
  modelsCount: number;
  onModelChange: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  selectGroups,
  modelInfo,
  modelsCount,
  onModelChange,
}) => {
  return (
    <div>
      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
        AI Model <Badge variant='primary'>{modelsCount} available</Badge>
      </label>
      <Select value={selectedModel} onChange={onModelChange} groups={selectGroups} placeholder='Select a model...' />
      {modelInfo && <ModelInfoCard model={modelInfo} className='mt-3' />}
    </div>
  );
};
