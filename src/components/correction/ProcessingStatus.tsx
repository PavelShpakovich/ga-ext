import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Wand2 } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

const MESSAGES = [
  'Analyzing sentence structure...',
  'Checking grammar rules...',
  'Polishing writing style...',
  'Enhancing clarity...',
  'Finalizing suggestions...',
];

export const ProcessingStatus: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000); // Change message every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex flex-col items-center justify-center py-6 animate-fade-in-up'>
      <div className='relative mb-4'>
        <LoadingSpinner size='lg' className='text-secondary-500' />
        <div className='absolute inset-0 flex items-center justify-center'>
          <Brain className='w-5 h-5 text-gray-400 dark:text-gray-500 animate-pulse' />
        </div>
      </div>

      <div className='flex items-center gap-2 mb-2'>
        <Sparkles className='w-4 h-4 text-yellow-500 animate-spin-slow' />
        <span className='font-semibold text-gray-900 dark:text-gray-100'>AI Editor Processing</span>
      </div>

      <p className='text-sm text-gray-500 dark:text-gray-400 h-6 transition-all duration-300 ease-in-out'>
        {MESSAGES[msgIndex]}
      </p>

      <div className='mt-6 flex gap-1.5 opacity-50'>
        <div className='w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce' style={{ animationDelay: '0s' }} />
        <div className='w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce' style={{ animationDelay: '0.2s' }} />
        <div className='w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce' style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
};
