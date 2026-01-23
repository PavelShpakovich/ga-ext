import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, showLabel = false, className = '' }) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={`w-full ${className}`}>
      <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'>
        <div
          className='bg-primary-500 h-full transition-all duration-300 ease-out'
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <p className='text-xs text-center text-gray-500 dark:text-gray-400 mt-1'>{percentage}%</p>}
    </div>
  );
};
