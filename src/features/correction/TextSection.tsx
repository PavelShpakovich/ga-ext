import React from 'react';
import clsx from 'clsx';
import { FileText, X, Wand2, RefreshCw } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/shared/components/ui/IconButton';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text && !isBusy) {
        e.preventDefault();
        onCorrect();
      }
    },
    [text, isBusy, onCorrect],
  );

  const hasText = Boolean(text && text.trim());

  const wrapperClass = clsx(
    'rounded-2xl overflow-hidden shadow-inner transition-all focus-within:ring-4 focus-within:ring-blue-500/5',
    hasText
      ? 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 focus-within:border-blue-500/50'
      : 'border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus-within:border-blue-500/50 focus-within:border-solid',
  );

  const textareaClass = clsx(
    'w-full bg-transparent p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 min-h-40 resize-none outline-none overflow-y-auto custom-scrollbar [scrollbar-gutter:stable] pr-4',
  );

  return (
    <Card
      title={title}
      icon={<FileText className='w-3.5 h-3.5' />}
      actions={
        text && (
          <>
            <IconButton
              icon={<X className='w-4 h-4' />}
              variant={IconButtonVariant.GHOST}
              size={IconButtonSize.SM}
              className='text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
              onClick={onClear}
              title={t('ui.clear_all')}
              aria-label={t('ui.clear_all')}
            />
            {(!hasResult || isResultStale) && !isBusy && (
              <IconButton
                icon={isResultStale ? <RefreshCw className='w-4 h-4' /> : <Wand2 className='w-4 h-4' />}
                variant={IconButtonVariant.PRIMARY}
                size={IconButtonSize.SM}
                onClick={onCorrect}
                title={isResultStale ? t('ui.update_results') : t('ui.run_ai')}
                aria-label={isResultStale ? t('ui.update_results') : t('ui.run_ai')}
              />
            )}
          </>
        )
      }
    >
      <div className='relative group'>
        <div className={wrapperClass} style={{ clipPath: 'inset(0 round 1rem)' }}>
          <textarea
            className={textareaClass}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder={hasText ? placeholder : emptyHint}
            autoFocus={!hasText}
          />
        </div>
      </div>
    </Card>
  );
};
