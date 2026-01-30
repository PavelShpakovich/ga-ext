import React, { useState } from 'react';
import { ArrowRight, Copy, Info, X, Diff } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import clsx from 'clsx';
import { Button, ButtonVariant } from '@/shared/components/Button';
import { Alert, AlertVariant } from '@/shared/components/ui/Alert';
import { TextButton, TextButtonVariant } from '@/shared/components/ui/TextButton';
import { CorrectionResult, ExecutionStep } from '@/shared/types';
import { StatusIndicator } from '@/features/models/StatusIndicator';
import { useTranslation } from 'react-i18next';
import { getDiff } from '@/shared/utils/diff';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/shared/components/ui';

interface ResultSectionProps {
  result: CorrectionResult | null;
  partialResult: string | null;
  onCopy: () => void;
  showDebug: boolean;
  onToggleDebug: () => void;
  onClearCache: () => void;
  localMessage: { message: string; variant: AlertVariant } | null;
  error: string | null;
  step: ExecutionStep;
  isBusy: boolean;
  title: string;
  reasoningLabel: string;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  result,
  partialResult,
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
  const [showDiff, setShowDiff] = useState(false);

  const diffParts = result ? getDiff(result.original, result.corrected) : [];

  return (
    <div className='space-y-4'>
      <StatusIndicator step={step} isBusy={isBusy} />

      {error && <Alert variant={AlertVariant.ERROR}>{error}</Alert>}
      {localMessage && !error && <Alert variant={localMessage.variant}>{localMessage.message}</Alert>}

      {!result && partialResult && (
        <Card title={title} icon={<ArrowRight className='w-3.5 h-3.5' />} className='animate-pulse'>
          <div className='bg-blue-50/10 dark:bg-blue-500/5 border border-blue-100/20 dark:border-blue-500/5 rounded-2xl p-5 text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-loose shadow-sm selection:bg-blue-200 dark:selection:bg-blue-700 min-h-25 max-h-96 overflow-y-auto custom-scrollbar'>
            {partialResult}
            <span className='inline-block w-1.5 h-4 ml-1 bg-blue-400 dark:bg-blue-600 animate-pulse align-middle' />
          </div>
        </Card>
      )}

      {result && (
        <Card
          title={title}
          icon={<ArrowRight className='w-3.5 h-3.5' />}
          className='animate-in fade-in slide-in-from-bottom-3 duration-500'
          actions={
            <IconButton
              icon={<Diff className='w-4 h-4' />}
              onClick={() => setShowDiff(!showDiff)}
              title={showDiff ? t('ui.show_corrected') : t('ui.show_diff')}
              variant={showDiff ? IconButtonVariant.PRIMARY : IconButtonVariant.GHOST}
              size={IconButtonSize.SM}
            />
          }
        >
          <div className='space-y-6'>
            {result.parseError ? (
              <div className='space-y-4'>
                <Alert
                  variant={AlertVariant.ERROR}
                  className='bg-rose-50/50 dark:bg-rose-500/5 border-rose-100/50 dark:border-rose-500/20'
                >
                  <div className='flex flex-col gap-1'>
                    <span className='font-bold text-rose-600 dark:text-rose-400'>{t('ui.fault')}</span>
                    <p className='text-rose-500/80 dark:text-rose-400/70 text-[12px] leading-relaxed'>
                      {t('error.unparseable_output_detail')}
                    </p>
                  </div>
                </Alert>
                <div className='bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 text-sm text-slate-400 dark:text-slate-500 italic whitespace-pre-wrap leading-loose'>
                  {result.original}
                </div>
              </div>
            ) : showDiff ? (
              <div className='bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100/30 dark:border-blue-500/10 rounded-2xl p-5 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-loose shadow-sm selection:bg-blue-200 dark:selection:bg-blue-700 min-h-25 max-h-96 overflow-y-auto custom-scrollbar'>
                {diffParts.map((part, i) => (
                  <span
                    key={i}
                    className={clsx({
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xs px-0.5':
                        part.added,
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through rounded-xs px-0.5':
                        part.removed,
                    })}
                  >
                    {part.value}
                  </span>
                ))}
              </div>
            ) : (
              <div className='bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100/30 dark:border-blue-500/10 rounded-2xl p-5 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-loose shadow-sm selection:bg-blue-200 dark:selection:bg-blue-700 min-h-25 max-h-96 overflow-y-auto custom-scrollbar'>
                {result.corrected}
              </div>
            )}

            {result.explanation && !result.parseError && (
              <div className='bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50'>
                <div className='flex items-center gap-2 mb-2'>
                  <Info className='w-3 h-3 text-blue-500' />
                  <span className='text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest'>
                    {reasoningLabel}
                  </span>
                </div>
                {Array.isArray(result.explanation) ? (
                  <ul className='text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed list-disc pl-5 space-y-1'>
                    {result.explanation.map((line, idx) => (
                      <li key={idx} className='indent-0.5'>
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed indent-0.5'>
                    {result.explanation}
                  </p>
                )}
              </div>
            )}

            <div className='pb-2'>
              <Button
                variant={ButtonVariant.PRIMARY}
                className='w-full h-12 text-xs font-bold'
                onClick={onCopy}
                disabled={!!result.parseError}
              >
                <Copy className='w-4 h-4' />
                {t('ui.copy_result')}
              </Button>
            </div>

            <div className='pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-1'>
              <TextButton onClick={onToggleDebug}>{showDebug ? t('ui.mask_output') : t('ui.view_output')}</TextButton>
            </div>

            {showDebug && (
              <div className='bg-slate-900 rounded-xl p-4 text-[10px] text-slate-400 font-mono space-y-3 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-800 shadow-2xl'>
                <div className='flex flex-col gap-1.5'>
                  <span className='text-blue-400/80 font-bold uppercase text-[9px] tracking-widest'>
                    {t('ui.engine_trace')}
                  </span>
                  <pre className='whitespace-pre-wrap wrap-break-word leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5 max-h-75 overflow-y-auto custom-scrollbar'>
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

      <div className='pt-2 flex justify-center'>
        <TextButton
          onClick={onClearCache}
          variant={TextButtonVariant.DANGER}
          className='text-[11px] opacity-50 hover:opacity-100 transition-opacity'
        >
          {t('ui.purge_storage')}
        </TextButton>
      </div>
    </div>
  );
};
