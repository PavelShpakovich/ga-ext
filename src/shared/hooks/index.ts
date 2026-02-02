/**
 * Barrel export for all shared React hooks.
 * Provides centralized access to custom hooks used throughout the application.
 */

// AI and Correction hooks
export { useAI } from './useAI';
export { useCorrectionActions } from './useCorrectionActions';
export type { CorrectionActionsConfig, CorrectionActionsResult } from './useCorrectionActions';
export { useCorrectionWorkflow } from './useCorrectionWorkflow';
export type { WorkflowCallbacks, WorkflowRefs } from './useCorrectionWorkflow';

// UI State hooks
export { useSidePanelState } from './useSidePanelState';
export type { SidePanelState, SidePanelStateSetters, SidePanelStateRefs } from './useSidePanelState';
export { useToastNotifications } from './useToastNotifications';
export type { ToastAction, ToastState } from './useToastNotifications';
export { useTheme } from './useTheme';

// Data and Validation hooks
export { useSettings } from './useSettings';
export { useCacheValidation } from './useCacheValidation';
export { useModelSelection } from './useModelSelection';
export { useLanguageMismatch } from './useLanguageMismatch';

// Communication hooks
export { useMessageService } from './useMessageService';
export { usePendingText } from './usePendingText';

// Feature-specific hooks
export { useDownloadProgress } from './useDownloadProgress';
export { useOCR } from './useOCR';
export { useClickOutside } from './useClickOutside';
