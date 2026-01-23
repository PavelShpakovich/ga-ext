import React from 'react';
import { Zap, Gauge, Snail } from 'lucide-react';

interface ModelInfo {
  family: string;
  speed: 'fast' | 'medium' | 'slow';
  size: string;
  description: string;
}

interface ModelInfoCardProps {
  model: ModelInfo;
  className?: string;
}

const speedConfig = {
  fast: { icon: Zap, label: 'Fast', className: 'text-green-600 dark:text-green-400' },
  medium: { icon: Gauge, label: 'Medium', className: 'text-yellow-600 dark:text-yellow-400' },
  slow: { icon: Snail, label: 'Slow', className: 'text-orange-600 dark:text-orange-400' },
};

export const ModelInfoCard: React.FC<ModelInfoCardProps> = ({ model, className = '' }) => {
  const { icon: SpeedIcon, label: speedLabel, className: speedColor } = speedConfig[model.speed];

  return (
    <div className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
      <div className='flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400'>
        <span className='font-medium'>{model.family}</span>
        <span>•</span>
        <span className='flex items-center gap-1'>
          <SpeedIcon className={`w-3 h-3 ${speedColor}`} />
          {speedLabel}
        </span>
        <span>•</span>
        <span>{model.size}</span>
      </div>
      <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{model.description}</p>
    </div>
  );
};
