import React from 'react';
import { XCircle, Lightbulb } from 'lucide-react';
import { Alert } from '../ui';

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <Alert variant='error'>
      <div className='flex items-start gap-2'>
        <XCircle className='w-4 h-4 flex-shrink-0 mt-0.5' />
        <div>
          <p className='text-sm font-medium'>{error}</p>
          <div className='flex items-start gap-1.5 mt-2 text-xs'>
            <Lightbulb className='w-3.5 h-3.5 flex-shrink-0 mt-0.5' />
            <p>Tip: Check that WebGPU is enabled in your browser (chrome://gpu)</p>
          </div>
        </div>
      </div>
    </Alert>
  );
};
