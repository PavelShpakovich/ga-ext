import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import clsx from 'clsx';
import { Button, ButtonVariant, ButtonSize } from '@/shared/components/Button';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_IMAGE_TYPES } from '@/core/constants';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = React.memo(
  ({ onImageSelect, disabled = false, className = '' }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const acceptedTypes = useMemo(() => SUPPORTED_IMAGE_TYPES.join(','), []);

    const isSupported = useCallback((file: File) => SUPPORTED_IMAGE_TYPES.includes(file.type as any), []);

    const selectFile = useCallback(
      (file: File) => {
        if (!file || !isSupported(file)) return;
        setSelectedFile(file);
        onImageSelect(file);
      },
      [isSupported, onImageSelect],
    );

    const onDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = Array.from(e.dataTransfer.files).find((f) => isSupported(f));
        if (file) selectFile(file);
      },
      [isSupported, selectFile],
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
    }, []);

    const onFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) selectFile(file);
      },
      [selectFile],
    );

    const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

    const clear = useCallback(() => {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type='file'
          accept={acceptedTypes}
          onChange={onFileInputChange}
          className='hidden'
          disabled={disabled}
        />

        {!selectedFile ? (
          <div
            role='button'
            tabIndex={0}
            onClick={openFilePicker}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={clsx(
              'relative rounded-2xl overflow-hidden shadow-inner transition-all p-6 text-center cursor-pointer focus-within:ring-4 focus-within:ring-blue-500/5',
              dragOver
                ? 'border border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                : 'border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:border-slate-400 dark:hover:border-slate-500',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <div className='flex flex-col items-center gap-3'>
              <div className='w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center'>
                <Upload className='w-6 h-6 text-slate-500 dark:text-slate-400' />
              </div>
              <div>
                <p className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'>{t('ocr.upload_image')}</p>
                <p className='text-sm text-slate-400 dark:text-slate-500'>
                  <span className='block mt-1'>{t('ocr.upload_placeholder')}</span>
                  <span className='block mt-1'>{t('ocr.supported_formats')}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className='relative border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0'>
                <ImageIcon className='w-5 h-5 text-slate-600 dark:text-slate-400' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-slate-900 dark:text-slate-100 truncate'>{selectedFile.name}</p>
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  {t('ocr.file_size', { size: (selectedFile.size / 1024 / 1024).toFixed(2) })}
                </p>
              </div>
              <Button
                variant={ButtonVariant.GHOST}
                size={ButtonSize.SM}
                onClick={clear}
                disabled={disabled}
                className='shrink-0 p-1 h-8 w-8'
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ImageUpload.displayName = 'ImageUpload';
