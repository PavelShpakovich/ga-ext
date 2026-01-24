import React from 'react';
import { Loader2 } from 'lucide-react';

interface StatusIndicatorProps {
  step: string;
  isBusy: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ step, isBusy }) => {
  if (step === 'idle' && !isBusy) return null;

  // Derive a more accurate label based on the combination of step and busy-ness
  let label = '';
  if (step === 'preparing-model') {
    label = 'Initializing AI...';
  } else if (step === 'correcting') {
    label = 'Analysing Text...';
  } else if (step === 'done' && isBusy) {
    // This happens if we're busy with sync/delete but the previous result is still there
    label = 'Busy...';
  } else if (step === 'done') {
    label = 'Ready';
  } else if (step === 'error') {
    label = 'Execution Halted';
  } else if (isBusy) {
    label = 'Processing...';
  }

  return (
    <div className='flex items-center gap-2.5 px-2 py-1 animate-in fade-in slide-in-from-left-1 duration-300'>
      {isBusy ? (
        <Loader2 className='w-4 h-4 text-blue-500 animate-spin' />
      ) : (
        <div className='w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' />
      )}
      <span className='text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]'>
        {label}
      </span>
    </div>
  );
};
