import React from 'react';
import { XCircle, Lightbulb } from 'lucide-react';
import { Alert } from '../ui';

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  // Provide helpful guidance based on error type
  const getTip = (errorMessage: string): string => {
    if (errorMessage.toLowerCase().includes('webgpu')) {
      return 'Enable WebGPU in chrome://flags or try a different browser (Chrome/Edge recommended)';
    }
    if (errorMessage.toLowerCase().includes('model')) {
      return 'Try reloading the page or clearing the cache in Settings';
    }
    if (errorMessage.toLowerCase().includes('parse') || errorMessage.toLowerCase().includes('json')) {
      return 'The AI model had trouble formatting its response. Try again or use a smaller text.';
    }
    if (errorMessage.toLowerCase().includes('protected') || errorMessage.toLowerCase().includes('preservation')) {
      return 'The AI tried to change emails/names. We protected your text - please try again.';
    }
    return 'Try refreshing the page or contact support if the issue persists';
  };

  return (
    <Alert variant='error'>
      <div className='flex items-start gap-2'>
        <XCircle className='w-4 h-4 shrink-0 mt-0.5' />
        <div className='flex-1'>
          <p className='text-sm font-medium mb-1'>{error}</p>
          <div className='flex items-start gap-1.5 text-xs opacity-90'>
            <Lightbulb className='w-3.5 h-3.5 shrink-0 mt-0.5' />
            <p>{getTip(error)}</p>
          </div>
        </div>
      </div>
    </Alert>
  );
};
