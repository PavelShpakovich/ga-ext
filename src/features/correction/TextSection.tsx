import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { FileText, X, Wand2, RefreshCw, Image } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/shared/components/ui/IconButton';
import { ImageUpload } from '@/shared/components/ui/ImageUpload';
import { Alert, AlertVariant } from '@/shared/components/ui/Alert';
import { TabSelector, type TabOption } from '@/shared/components/ui/TabSelector';
import { useOCR } from '@/shared/hooks/useOCR';
import { useTranslation } from 'react-i18next';
import { InputMode } from '@/shared/types';
import { capitalize } from '@/shared/utils/helpers';
import { OCRProgress } from '@/shared/components/ui/OCRProgress';

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
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.TEXT);
  const { processImage, isProcessing, progress, error, reset: resetOCR } = useOCR();

  const tabOptions: TabOption[] = [
    {
      id: InputMode.TEXT,
      label: t('ui.text'),
      icon: FileText,
    },
    {
      id: InputMode.OCR,
      label: t('ui.ocr'),
      icon: Image,
    },
  ];

  const handleImageSelect = React.useCallback(
    async (file: File) => {
      const extractedText = await processImage(file);
      if (extractedText) {
        onTextChange(extractedText);
        setInputMode(InputMode.TEXT); // Switch back to text mode after successful extraction
      }
    },
    [processImage, onTextChange],
  );

  const handlePaste = React.useCallback(
    async (e: ClipboardEvent) => {
      if (inputMode !== InputMode.OCR || isProcessing || isBusy) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleImageSelect(file);
          }
          break;
        }
      }
    },
    [inputMode, isProcessing, isBusy, handleImageSelect],
  );

  const handleTabSelect = (id: string) => {
    const mode = id as InputMode;
    setInputMode(mode);
    if (mode === InputMode.OCR) {
      resetOCR();
    }
  };

  useEffect(() => {
    if (inputMode === InputMode.OCR) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [inputMode, handlePaste]);

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
              disabled={isBusy}
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
      <TabSelector
        options={tabOptions}
        selectedId={inputMode}
        onSelect={handleTabSelect}
        className='mb-4'
        disabled={isBusy}
      />

      {inputMode === InputMode.TEXT ? (
        <div className='relative group'>
          <div className={clsx(wrapperClass, 'overflow-hidden rounded-2xl')}>
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
      ) : (
        <div className='flex flex-col gap-4'>
          <ImageUpload onImageSelect={handleImageSelect} disabled={isBusy || isProcessing} />

          {isProcessing && progress && (
            <OCRProgress status={capitalize(progress.status)} progress={progress.progress} />
          )}

          {error && <Alert variant={AlertVariant.ERROR}>{error}</Alert>}
        </div>
      )}
    </Card>
  );
};
