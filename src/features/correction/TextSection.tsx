import React from 'react';
import { FileText, X, Wand2, RefreshCw } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/shared/components/ui/IconButton';
import { Button, ButtonVariant, ButtonSize } from '@/shared/components/Button';
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

  return (
    <Card title={title} icon={<FileText className='w-3.5 h-3.5' />}>
      <div className='relative group'>
        {text ? (
          <div className='flex flex-col gap-3'>
            <textarea
              className='w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 min-h-40 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner custom-scrollbar'
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              disabled={isBusy}
              placeholder={placeholder}
            />
            <div className='flex items-center justify-end gap-2 px-1'>
              <IconButton
                icon={<X className='w-4 h-4' />}
                variant={IconButtonVariant.GHOST}
                size={IconButtonSize.SM}
                className='text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                onClick={onClear}
                title={t('ui.clear_all')}
              />
              {(!hasResult || isResultStale) && !isBusy && (
                <Button
                  variant={ButtonVariant.PRIMARY}
                  size={ButtonSize.SM}
                  className='h-10 px-5 shadow-blue-500/20'
                  onClick={onCorrect}
                >
                  {isResultStale ? (
                    <>
                      <RefreshCw className='w-3.5 h-3.5' />
                      {t('ui.update_results')}
                    </>
                  ) : (
                    <>
                      <Wand2 className='w-3.5 h-3.5' />
                      {t('ui.run_ai')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <textarea
            className='w-full bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 min-h-[200px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:border-solid outline-none transition-all resize-none shadow-inner custom-scrollbar'
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={emptyHint}
            autoFocus
          />
        )}
      </div>
    </Card>
  );
};
