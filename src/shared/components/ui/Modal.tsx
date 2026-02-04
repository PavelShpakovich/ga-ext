import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button, ButtonVariant } from '@/shared/components/Button';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/shared/components/ui/IconButton';

export enum ModalVariant {
  DANGER = 'danger',
  INFO = 'info',
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = ModalVariant.INFO,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800'>
          <div className='flex items-start gap-4'>
            <div
              className={`shrink-0 p-3 rounded-xl ${
                variant === ModalVariant.DANGER
                  ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-100 dark:ring-red-900/30'
                  : 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-900/30'
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${variant === ModalVariant.DANGER ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}
              />
            </div>
            <div className='flex-1 min-w-0 pt-1'>
              <h3 className='text-base font-bold text-slate-900 dark:text-white leading-tight'>{title}</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>{message}</p>
            </div>
          </div>
          <IconButton
            icon={<X />}
            onClick={onClose}
            variant={IconButtonVariant.GHOST}
            size={IconButtonSize.SM}
            className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          />
        </div>

        <div className='px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 flex gap-3'>
          <Button variant={ButtonVariant.OUTLINE} className='flex-1' onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === ModalVariant.DANGER ? ButtonVariant.DANGER : ButtonVariant.PRIMARY}
            className='flex-1'
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
