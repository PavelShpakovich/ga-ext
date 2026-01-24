import React from 'react';
import { ArrowRight, Copy, Info, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/Button';
import { Alert } from '../../components/ui/Alert';
import { StatusIndicator } from './StatusIndicator';
import { useTranslation } from 'react-i18next';

interface ResultSectionProps {
  result: any;
  onCopy: () => void;
  showDebug: boolean;
  onToggleDebug: () => void;
  onClearCache: () => void;
  localMessage: string | null;
  error: string | null;
  step: string;
  isBusy: boolean;
  title: string;
  reasoningLabel: string;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  result,
  onCopy,
  showDebug,
  onToggleDebug,
  onClearCache,
  localMessage,
  error,
  step,
  isBusy,
  title,
  reasoningLabel,
}) => {
  const { t } = useTranslation();

  return (
    <div className='space-y-4'>
      <StatusIndicator step={step} isBusy={isBusy} />

      {error && <Alert variant='error'>{error}</Alert>}
      {localMessage && !error && <Alert variant='success'>{localMessage}</Alert>}

      {result && (
        <Card
          title={title}
          icon={<ArrowRight className='w-3.5 h-3.5' />}
          className='animate-in fade-in slide-in-from-bottom-3 duration-500'
        >
          <div className='space-y-6'>
            <div className='bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100/30 dark:border-blue-500/10 rounded-2xl p-5 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-loose shadow-sm selection:bg-blue-200 dark:selection:bg-blue-700 min-h-[100px] overflow-y-auto custom-scrollbar'>
              {result.corrected}
            </div>

            {result.explanation && (
              <div className='bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50'>
                <div className='flex items-center gap-2 mb-2'>
                  <Info className='w-3 h-3 text-blue-500' />
                  <span className='text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest'>
                    {reasoningLabel}
                  </span>
                </div>
                <p className='text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed indent-0.5'>
                  {result.explanation}
                </p>
              </div>
            )}

            <div className='pb-2'>
              <Button variant='primary' className='w-full h-12 text-xs font-bold' onClick={onCopy}>
                <Copy className='w-4 h-4' />
                {t('ui.copy_result')}
              </Button>
            </div>

            <div className='pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-1'>
              <button
                onClick={onToggleDebug}
                className='text-[9px] font-bold text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-1.5'
              >
                {showDebug ? t('ui.mask_output') : t('ui.view_output')}
              </button>
              <button
                onClick={onClearCache}
                className='text-[9px] font-bold text-slate-300 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-[0.15em] transition-colors pl-2'
              >
                {t('ui.purge_storage')}
              </button>
            </div>

            {showDebug && (
              <div className='bg-slate-900 rounded-xl p-4 text-[10px] text-slate-400 font-mono space-y-3 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-800 shadow-2xl'>
                <div className='flex flex-col gap-1.5'>
                  <span className='text-blue-400/80 font-bold uppercase text-[9px] tracking-widest'>
                    {t('ui.engine_trace')}
                  </span>
                  <pre className='whitespace-pre-wrap break-words leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar'>
                    {result.raw || t('messages.no_engine_trace')}
                  </pre>
                </div>
                {result.parseError && (
                  <div className='flex items-center gap-2 text-red-400 bg-red-400/5 p-2 rounded-lg border border-red-400/20'>
                    <X className='w-3 h-3' />
                    <span className='font-bold uppercase tracking-tighter'>[{t('ui.fault')}]:</span> {result.parseError}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
