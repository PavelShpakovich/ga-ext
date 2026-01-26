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
}

const variantStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const icons = {
  success: <CheckCircle className='w-5 h-5 text-green-500' />,
  error: <AlertCircle className='w-5 h-5 text-red-500' />,
  warning: <AlertCircle className='w-5 h-5 text-yellow-500' />,
  info: <Info className='w-5 h-5 text-blue-500' />,
};

export const Toast: React.FC<ToastProps> = ({ message, variant = 'info', isVisible, onClose, duration = 3000 }) => {
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
         min-w-75 max-w-sm
        `}
      >
        {icons[variant]}
        <p className='text-sm font-medium flex-1'>{message}</p>
        <button onClick={onClose} className='p-1 hover:bg-black/5 rounded-full transition-colors'>
          <X className='w-4 h-4 opacity-60' />
        </button>
      </div>
    </div>,
    document.body,
  );
};
