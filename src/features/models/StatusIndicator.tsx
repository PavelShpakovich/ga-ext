import React from 'react';
import { Loader2 } from 'lucide-react';
import { ExecutionStep } from '@/shared/types';
import { useTranslation } from 'react-i18next';

interface StatusIndicatorProps {
  step: ExecutionStep;
  isBusy: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ step, isBusy }) => {
  const { t } = useTranslation();

  if (step === ExecutionStep.IDLE && !isBusy) return null;

  // Derive a more accurate label based on the combination of step and busy-ness
  let label = '';
  if (step === ExecutionStep.PREPARING_MODEL) {
    label = t('status.preparing');
  } else if (step === ExecutionStep.CORRECTING) {
    label = t('status.analysing');
  } else if (step === ExecutionStep.DONE && isBusy) {
    // This happens if we're busy with sync/delete but the previous result is still there
    label = t('status.busy');
  } else if (step === ExecutionStep.DONE) {
    label = t('status.ready');
  } else if (step === ExecutionStep.ERROR) {
    label = t('status.halting');
  } else if (isBusy) {
    label = t('status.processing');
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
