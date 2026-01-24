import React from 'react';
import { FileText, X, Wand2, RefreshCw } from 'lucide-react';
import { Card } from '../../components/Card';
import { IconButton } from '../../components/ui/IconButton';

interface TextSectionProps {
  text: string;
  onTextChange: (val: string) => void;
  onClear: () => void;
  onCorrect: () => void;
  isBusy: boolean;
  hasResult: boolean;
  isResultStale: boolean;
  title: string;
  placeholder: string;
  emptyHint: string;
}

export const TextSection: React.FC<TextSectionProps> = ({
  text,
  onTextChange,
  onClear,
  onCorrect,
  isBusy,
  hasResult,
  isResultStale,
  title,
  placeholder,
  emptyHint,
}) => {
  return (
    <Card title={title} icon={<FileText className='w-3.5 h-3.5' />}>
      <div className='relative group'>
        {text ? (
          <div className='relative'>
            <textarea
              className='w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 min-h-[180px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner'
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              disabled={isBusy}
              placeholder={placeholder}
            />
            <div className='absolute bottom-3 right-3 flex gap-2'>
              <IconButton
                icon={<X />}
                variant='ghost'
                size='sm'
                className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700'
                onClick={onClear}
                title='Clear all'
              />
              {(!hasResult || isResultStale) && !isBusy && (
                <IconButton
                  icon={isResultStale ? <RefreshCw /> : <Wand2 />}
                  variant='primary'
                  size='sm'
                  className='shadow-blue-500/40 animate-in zoom-in-95 duration-200'
                  onClick={onCorrect}
                  title={isResultStale ? 'Update Results' : 'Run AI Correction'}
                />
              )}
            </div>
          </div>
        ) : (
          <div className='py-16 text-center bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors'>
            <div className='mb-4 flex justify-center'>
              <div className='p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700'>
                <FileText className='w-6 h-6 text-slate-300 dark:text-slate-600' />
              </div>
            </div>
            <p className='text-xs font-medium text-slate-400 dark:text-slate-500 px-8 leading-loose uppercase tracking-widest text-center'>
              {emptyHint}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
