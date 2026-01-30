import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageService } from '../useMessageService';
import { ModalVariant } from '@/shared/components/ui/Modal';

describe('useMessageService', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  describe('toast management', () => {
    it('should initialize with hidden toast', () => {
      const { result } = renderHook(() => useMessageService());

      expect(result.current.toast.isVisible).toBe(false);
      expect(result.current.toast.message).toBe('');
      expect(result.current.toast.variant).toBe('info');
    });

    it('should show toast with message and variant', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showToast('Test message', 'success');
      });

      expect(result.current.toast.isVisible).toBe(true);
      expect(result.current.toast.message).toBe('Test message');
      expect(result.current.toast.variant).toBe('success');
    });

    it('should show toast with action callback', () => {
      const { result } = renderHook(() => useMessageService());
      const mockAction = { label: 'Undo', onClick: () => {} };

      act(() => {
        result.current.showToast('Message', 'info', mockAction);
      });

      expect(result.current.toast.action).toEqual(mockAction);
    });

    it('should default to info variant when not specified', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showToast('Message');
      });

      expect(result.current.toast.variant).toBe('info');
    });

    it('should hide toast', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showToast('Test', 'success');
      });

      expect(result.current.toast.isVisible).toBe(true);

      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toast.isVisible).toBe(false);
    });

    it('should support all toast variants', () => {
      const { result } = renderHook(() => useMessageService());
      const variants: Array<'success' | 'error' | 'info' | 'warning'> = ['success', 'error', 'info', 'warning'];

      variants.forEach((variant) => {
        act(() => {
          result.current.showToast('Test', variant);
        });

        expect(result.current.toast.variant).toBe(variant);
      });
    });
  });

  describe('modal management', () => {
    it('should initialize with closed modal', () => {
      const { result } = renderHook(() => useMessageService());

      expect(result.current.modalConfig.isOpen).toBe(false);
      expect(result.current.modalConfig.title).toBe('');
      expect(result.current.modalConfig.message).toBe('');
    });

    it('should show modal with title, message, and callback', () => {
      const { result } = renderHook(() => useMessageService());
      const mockConfirm = () => {};

      act(() => {
        result.current.showModal('Confirm', 'Are you sure?', mockConfirm);
      });

      expect(result.current.modalConfig.isOpen).toBe(true);
      expect(result.current.modalConfig.title).toBe('Confirm');
      expect(result.current.modalConfig.message).toBe('Are you sure?');
      expect(result.current.modalConfig.onConfirm).toBe(mockConfirm);
    });

    it('should show modal with custom options', () => {
      const { result } = renderHook(() => useMessageService());
      const mockConfirm = () => {};

      act(() => {
        result.current.showModal('Delete', 'Delete this item?', mockConfirm, {
          variant: ModalVariant.DANGER,
          confirmLabel: 'Delete',
          cancelLabel: 'Keep',
        });
      });

      expect(result.current.modalConfig.isOpen).toBe(true);
      expect(result.current.modalConfig.variant).toBe(ModalVariant.DANGER);
      expect(result.current.modalConfig.confirmLabel).toBe('Delete');
      expect(result.current.modalConfig.cancelLabel).toBe('Keep');
    });

    it('should close modal', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showModal('Title', 'Message', () => {});
      });

      expect(result.current.modalConfig.isOpen).toBe(true);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.modalConfig.isOpen).toBe(false);
    });
  });

  describe('convenience toast methods', () => {
    it('showSuccessToast should show success toast', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showSuccessToast('Success!');
      });

      expect(result.current.toast.isVisible).toBe(true);
      expect(result.current.toast.message).toBe('Success!');
      expect(result.current.toast.variant).toBe('success');
    });

    it('showSuccessToast should support action', () => {
      const { result } = renderHook(() => useMessageService());
      const mockAction = { label: 'Retry', onClick: () => {} };

      act(() => {
        result.current.showSuccessToast('Success!', mockAction);
      });

      expect(result.current.toast.action).toEqual(mockAction);
    });

    it('showErrorToast should show error toast', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showErrorToast('Error occurred');
      });

      expect(result.current.toast.isVisible).toBe(true);
      expect(result.current.toast.message).toBe('Error occurred');
      expect(result.current.toast.variant).toBe('error');
    });

    it('showErrorToast should support action', () => {
      const { result } = renderHook(() => useMessageService());
      const mockAction = { label: 'Retry', onClick: () => {} };

      act(() => {
        result.current.showErrorToast('Error', mockAction);
      });

      expect(result.current.toast.action).toEqual(mockAction);
    });

    it('showWarningToast should show warning toast', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showWarningToast('Warning!');
      });

      expect(result.current.toast.isVisible).toBe(true);
      expect(result.current.toast.message).toBe('Warning!');
      expect(result.current.toast.variant).toBe('warning');
    });

    it('showWarningToast should support action', () => {
      const { result } = renderHook(() => useMessageService());
      const mockAction = { label: 'Dismiss', onClick: () => {} };

      act(() => {
        result.current.showWarningToast('Warning', mockAction);
      });

      expect(result.current.toast.action).toEqual(mockAction);
    });
  });

  describe('concurrent operations', () => {
    it('should handle toast and modal simultaneously', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showToast('Saving...', 'info');
        result.current.showModal('Confirm', 'Continue?', () => {});
      });

      expect(result.current.toast.isVisible).toBe(true);
      expect(result.current.modalConfig.isOpen).toBe(true);
    });

    it('should handle updating toast while modal is open', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showModal('Confirm', 'Continue?', () => {});
        result.current.showToast('Updated', 'success');
      });

      expect(result.current.modalConfig.isOpen).toBe(true);
      expect(result.current.toast.message).toBe('Updated');
      expect(result.current.toast.variant).toBe('success');
    });

    it('should handle closing both toast and modal', () => {
      const { result } = renderHook(() => useMessageService());

      act(() => {
        result.current.showToast('Message', 'info');
        result.current.showModal('Title', 'Message', () => {});
      });

      act(() => {
        result.current.hideToast();
        result.current.closeModal();
      });

      expect(result.current.toast.isVisible).toBe(false);
      expect(result.current.modalConfig.isOpen).toBe(false);
    });
  });

  describe('state preservation', () => {
    it('should preserve other toast properties when updating', () => {
      const { result } = renderHook(() => useMessageService());
      const mockAction = { label: 'Undo', onClick: () => {} };

      act(() => {
        result.current.showToast('First message', 'success', mockAction);
      });

      const firstToast = { ...result.current.toast };

      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toast.action).toEqual(mockAction);
      expect(result.current.toast.variant).toBe(firstToast.variant);
    });

    it('should preserve modal properties when closing', () => {
      const { result } = renderHook(() => useMessageService());
      const mockConfirm = () => {};

      act(() => {
        result.current.showModal('Title', 'Message', mockConfirm);
      });

      const originalConfig = result.current.modalConfig;

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.modalConfig.title).toBe(originalConfig.title);
      expect(result.current.modalConfig.onConfirm).toBe(mockConfirm);
    });
  });
});
