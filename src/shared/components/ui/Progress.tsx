import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, showLabel = false, className = '' }) => {
  const percentage = Math.round((value / max) * 100);
  const safePercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`w-full ${className}`}>
      <div className='w-full bg-slate-200/50 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner'>
        <div
          className='bg-blue-500 h-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.3)]'
          style={{ width: `${safePercentage}%` }}
        />
      </div>
      {showLabel && (
        <div className='flex justify-between items-center mt-2'>
          <span className='text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest'>
            Status
          </span>
          <span className='text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest'>
            {safePercentage}%
          </span>
        </div>
      )}
    </div>
  );
};
