import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from './Progress';

interface OCRProgressProps {
  status: string;
  progress: number; // 0..1
  className?: string;
}

export const OCRProgress: React.FC<OCRProgressProps> = ({ status, progress, className = '' }) => {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return (
    <div className={`${className}`}>
      <div className='bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4'>
        <div className='flex items-center gap-3 mb-2'>
          <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
          <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>{status}</span>
        </div>
        <Progress value={safeProgress * 100} max={100} />
      </div>
    </div>
  );
};

export default OCRProgress;
