import { useState, useCallback } from 'react';
import { ToastVariant } from '@/shared/types';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastState {
  message: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  action?: ToastAction;
}

/**
 * Hook for managing toast notifications with actions.
 * Provides a simple interface to show/hide toast messages with different variants.
 *
 * @returns Toast state and control functions
 */
export function useToastNotifications() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    variant: 'info',
    isVisible: false,
  });

  /**
   * Shows a toast notification with optional action button
   * @param message - The message to display
   * @param variant - The toast variant (success, error, info, warning)
   * @param action - Optional action button config
   */
  const showToast = useCallback((message: string, variant: ToastVariant = ToastVariant.INFO, action?: ToastAction) => {
    setToast({ message, variant, isVisible: true, action });
  }, []);

  /**
   * Hides the currently visible toast
   */
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
