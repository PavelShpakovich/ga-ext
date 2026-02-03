import { useState, useCallback } from 'react';
import { ToastVariant } from '@/shared/types';
import { ModalVariant } from '@/shared/components/ui/Modal';
import { ModalConfig, ToastState } from '@/shared/types/ui.types';

/**
 * Custom hook for managing toast and modal UI state
 * Provides consistent message handling across the application
 */
export const useMessageService = () => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    variant: ToastVariant.INFO,
    isVisible: false,
  });

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  /**
   * Show a toast notification with optional action button
   */
  const showToast = useCallback(
    (message: string, variant: ToastVariant = ToastVariant.INFO, action?: { label: string; onClick: () => void }) => {
      setToast({ message, variant, isVisible: true, action });
    },
    [],
  );

  /**
   * Hide the currently visible toast
   */
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  /**
   * Show a confirmation modal
   */
  const showModal = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      options?: {
        variant?: ModalVariant;
        confirmLabel?: string;
        cancelLabel?: string;
      },
    ) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        onConfirm,
        variant: options?.variant,
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
      });
    },
    [],
  );

  /**
   * Close the currently open modal
   */
  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Show a success toast (convenience method)
   */
  const showSuccessToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, ToastVariant.SUCCESS, action);
    },
    [showToast],
  );

  /**
   * Show an error toast (convenience method)
   */
  const showErrorToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, ToastVariant.ERROR, action);
    },
    [showToast],
  );

  /**
   * Show a warning toast (convenience method)
   */
  const showWarningToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast(message, ToastVariant.WARNING, action);
    },
    [showToast],
  );

  return {
    // State
    toast,
    modalConfig,

    // Toast methods
    showToast,
    hideToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,

    // Modal methods
    showModal,
    closeModal,
  };
};
