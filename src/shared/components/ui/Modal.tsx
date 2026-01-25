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
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200'>
      <div
        className='bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='px-6 pt-6 pb-2 flex justify-between items-start'>
          <div
            className={`p-2 rounded-xl ${variant === ModalVariant.DANGER ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${variant === ModalVariant.DANGER ? 'text-red-500' : 'text-blue-500'}`}
            />
          </div>
          <IconButton
            icon={<X />}
            onClick={onClose}
            variant={IconButtonVariant.GHOST}
            size={IconButtonSize.SM}
            className='-mr-2 -mt-2'
          />
        </div>

        <div className='px-6 py-4'>
          <h3 className='text-lg font-bold text-slate-800 dark:text-white mb-2'>{title}</h3>
          <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>{message}</p>
        </div>

        <div className='px-6 pb-6 pt-2 flex gap-3'>
          <Button variant={ButtonVariant.SECONDARY} className='flex-1 h-11 text-xs' onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={ButtonVariant.PRIMARY}
            className={`flex-1 h-11 text-xs ${variant === ModalVariant.DANGER ? 'bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600' : ''}`}
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
