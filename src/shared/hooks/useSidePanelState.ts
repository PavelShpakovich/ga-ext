import { useState, useRef } from 'react';
import { Language, ToastVariant } from '@/shared/types';
import { AlertVariant } from '@/shared/components/ui/Alert';
import { ModalConfig, ToastState } from '@/shared/types/ui.types';

export interface SidePanelState {
  text: string;
  localMessage: { message: string; variant: AlertVariant } | null;
  isPrefetching: boolean;
  isDeleting: boolean;
  isRemovingModel: boolean;
  showDebug: boolean;
  isModelCached: boolean;
  isCheckingCache: boolean;
  mismatchDetected: Language | null;
  modalConfig: ModalConfig;
  toast: ToastState;
}

/**
 * State setters for SidePanel
 * Provides type-safe callbacks for updating state
 */
export interface SidePanelStateSetters {
  setText: (text: string) => void;
  setLocalMessage: (msg: { message: string; variant: AlertVariant } | null) => void;
  setIsPrefetching: (value: boolean) => void;
  setIsDeleting: (value: boolean) => void;
  setIsRemovingModel: (value: boolean) => void;
  setShowDebug: (value: boolean) => void;
  setIsModelCached: (value: boolean) => void;
  setIsCheckingCache: (value: boolean) => void;
  setMismatchDetected: (lang: Language | null) => void;
  setModalConfig: (config: ModalConfig) => void;
  setToast: (toast: ToastState) => void;
}

/**
 * State refs for SidePanel
 * Holds mutable references used for workflow control
 */
export interface SidePanelStateRefs {
  lastAutoRunKey: { current: string | null };
  shouldAutoRunRef: { current: boolean };
  confirmedLanguageRef: { current: Language | null };
}

/**
 * Custom hook for consolidating SidePanel state management
 * Reduces component complexity by organizing all state declarations
 * Makes it easier to test state logic independently
 */
export const useSidePanelState = () => {
  // Core UI state
  const [text, setText] = useState('');
  const [localMessage, setLocalMessage] = useState<{ message: string; variant: AlertVariant } | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingModel, setIsRemovingModel] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Cache-related state
  const [isModelCached, setIsModelCached] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [mismatchDetected, setMismatchDetected] = useState<Language | null>(null);

  // Dialog state
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<ToastState>({
    message: '',
    variant: ToastVariant.INFO,
    isVisible: false,
  });

  // Workflow control refs (not part of UI rendering)
  const lastAutoRunKey = useRef<string | null>(null);
  const shouldAutoRunRef = useRef<boolean>(false);
  const confirmedLanguageRef = useRef<Language | null>(null);

  const state: SidePanelState = {
    text,
    localMessage,
    isPrefetching,
    isDeleting,
    isRemovingModel,
    showDebug,
    isModelCached,
    isCheckingCache,
    mismatchDetected,
    modalConfig,
    toast,
  };

  const setters: SidePanelStateSetters = {
    setText,
    setLocalMessage,
    setIsPrefetching,
    setIsDeleting,
    setIsRemovingModel,
    setShowDebug,
    setIsModelCached,
    setIsCheckingCache,
    setMismatchDetected,
    setModalConfig,
    setToast,
  };

  const refs: SidePanelStateRefs = {
    lastAutoRunKey,
    shouldAutoRunRef,
    confirmedLanguageRef,
  };

  return { state, setters, refs };
};
