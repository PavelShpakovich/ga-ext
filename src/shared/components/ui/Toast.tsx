import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantStyles = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  warning:
    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
};

const icons = {
  success: <CheckCircle className='w-5 h-5 text-green-500' />,
  error: <AlertCircle className='w-5 h-5 text-red-500' />,
  warning: <AlertCircle className='w-5 h-5 text-yellow-500' />,
  info: <Info className='w-5 h-5 text-blue-500' />,
};

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  isVisible,
  onClose,
  duration = 3000,
  action,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  // Render using portal to ensure it floats above everything in the SidePanel
  return createPortal(
    <div className='fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2'>
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg 
          ${variantStyles[variant]}
         min-w-85 max-w-sm
        `}
      >
        {icons[variant]}
        <div className='flex flex-col gap-1 flex-1'>
          <p className='text-sm font-medium'>{message}</p>
          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                onClose();
              }}
              className='text-xs font-bold uppercase tracking-wider text-left hover:underline opacity-80 dark:opacity-90'
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className='p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer'
        >
          <X className='w-4 h-4 opacity-60 dark:opacity-70' />
        </button>
      </div>
    </div>,
    document.body,
  );
};
