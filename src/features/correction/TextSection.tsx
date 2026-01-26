import React from 'react';
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
      // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to run correction
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text && !isBusy) {
        e.preventDefault();
        onCorrect();
      }
    },
    [text, isBusy, onCorrect],
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
        {text ? (
          <textarea
            className='w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 min-h-40 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner custom-scrollbar'
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder={placeholder}
          />
        ) : (
          <textarea
            className='w-full bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 min-h-50 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:border-solid outline-none transition-all resize-none shadow-inner custom-scrollbar'
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder={emptyHint}
            autoFocus
          />
        )}
      </div>
    </Card>
  );
};
