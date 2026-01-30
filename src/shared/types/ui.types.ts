import { AlertVariant } from '@/shared/components/ui/Alert';
import { ModalVariant } from '@/shared/components/ui/Modal';

/**
 * Configuration for modal dialogs
 * Used across the app for consistent modal handling
 */
export interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
}

/**
 * State for toast notifications
 * Includes optional action button
 */
export interface ToastState {
  message: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Configuration for alert messages
 */
export interface AlertState {
  message: string;
  variant: AlertVariant;
}

/**
 * Dropdown/select option format
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Action handler with label (used in buttons, menus, etc.)
 */
export interface LabeledAction {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'success';
}

/**
 * Common UI state for async operations
 */
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
