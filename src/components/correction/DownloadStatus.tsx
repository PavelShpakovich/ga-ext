import React from 'react';
import { Download, Zap, Radio } from 'lucide-react';
import { Progress } from '../ui';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';

interface DownloadStatusProps {
  progress: { text: string; progress: number; isDownloading: boolean };
  onStop: () => void;
  modelSize?: string;
}

export const DownloadStatus: React.FC<DownloadStatusProps> = ({ progress, onStop, modelSize = '~1-2 GB' }) => {
  // If loading from cache (not downloading)
  if (!progress.isDownloading) {
    return (
      <div className='flex flex-col items-center text-center animate-fade-in-up'>
        <div className='relative'>
          <LoadingSpinner size='lg' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <Zap className='w-5 h-5 text-yellow-500 animate-pulse' />
          </div>
        </div>
        <h3 className='text-gray-900 dark:text-gray-100 mt-4 font-semibold'>Warming Up Local AI</h3>
        <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 min-h-[1.5em]'>
          {progress.text || 'Loading model from secure storage...'}
        </p>
      </div>
    );
  }

  const getEstimatedTime = (size: string) => {
    if (size.includes('MB')) return '1-3 mins';
    return '5-15 mins';
  };

  const estimatedTime = getEstimatedTime(modelSize);

  // Downloading - show detailed progress
  return (
    <div className='flex flex-col items-center text-center w-full animate-fade-in-up'>
      <div className='relative mb-4'>
        <div className='absolute -inset-1 rounded-full bg-blue-100 dark:bg-blue-900/20 animate-ping opacity-75'></div>
        <div className='relative bg-white dark:bg-gray-800 rounded-full p-3 border-2 border-primary-100 dark:border-primary-900'>
          <Download className='w-6 h-6 text-primary-600 dark:text-primary-400' />
        </div>
      </div>

      <h3 className='text-gray-900 dark:text-gray-100 font-semibold'>Downloading AI Model</h3>
      <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4 flex items-center gap-1.5'>
        <Radio className='w-3 h-3' />
        Running locally on your device
      </p>

      <div className='w-full max-w-xs space-y-2'>
        <div className='flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300'>
          <span className='truncate max-w-[70%]'>{progress.text}</span>
          <span>{Math.round(progress.progress * 100)}%</span>
        </div>
        <Progress value={progress.progress} max={1} />
      </div>

      <div className='mt-5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-left w-full max-w-xs'>
        <p className='font-semibold text-blue-800 dark:text-blue-300 mb-1'>First-time setup info</p>
        <ul className='list-disc pl-4 space-y-1 text-blue-700 dark:text-blue-400 opacity-90'>
          <li>Download size: {modelSize} (one-time only)</li>
          <li>Takes {estimatedTime} depending on speed</li>
          <li>Future startups will be instant</li>
        </ul>
      </div>

      <Button
        variant='secondary'
        size='sm'
        onClick={onStop}
        className='mt-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-transparent'
      >
        Cancel Download
      </Button>
    </div>
  );
};
