import { describe, it, expect, vi } from 'vitest';
import { CacheStateManager, CacheStateEnum } from '../CacheStateManager';
import { ExecutionStep } from '@/shared/types';

describe('CacheStateManager', () => {
  describe('derive', () => {
    it('should return CHECKING when isCheckingCache is true', () => {
      const state = CacheStateManager.derive({
        isCheckingCache: true,
        isPrefetching: false,
        step: ExecutionStep.IDLE,
        isModelCached: false,
      });
      expect(state).toBe(CacheStateEnum.CHECKING);
    });

    it('should return CHECKING even if other conditions are true', () => {
      // Checking has highest priority
      const state = CacheStateManager.derive({
        isCheckingCache: true,
        isPrefetching: true,
        step: ExecutionStep.PREPARING_MODEL,
        isModelCached: true,
      });
      expect(state).toBe(CacheStateEnum.CHECKING);
    });

    it('should return SYNCING when isPrefetching is true and not checking', () => {
      const state = CacheStateManager.derive({
        isCheckingCache: false,
        isPrefetching: true,
        step: ExecutionStep.IDLE,
        isModelCached: false,
      });
      expect(state).toBe(CacheStateEnum.SYNCING);
    });

    it('should return LOADING when step is PREPARING_MODEL and not checking or prefetching', () => {
      const state = CacheStateManager.derive({
        isCheckingCache: false,
        isPrefetching: false,
        step: ExecutionStep.PREPARING_MODEL,
        isModelCached: false,
      });
      expect(state).toBe(CacheStateEnum.LOADING);
    });

    it('should return READY when model is cached and no other operations in progress', () => {
      const state = CacheStateManager.derive({
        isCheckingCache: false,
        isPrefetching: false,
        step: ExecutionStep.IDLE,
        isModelCached: true,
      });
      expect(state).toBe(CacheStateEnum.READY);
    });

    it('should return DOWNLOAD when model is not cached and no operations in progress', () => {
      const state = CacheStateManager.derive({
        isCheckingCache: false,
        isPrefetching: false,
        step: ExecutionStep.IDLE,
        isModelCached: false,
      });
      expect(state).toBe(CacheStateEnum.DOWNLOAD);
    });

    it('should prioritize states correctly: CHECKING > PREFETCHING > LOADING > READY > DOWNLOAD', () => {
      // This verifies the precedence chain
      expect(
        CacheStateManager.derive({
          isCheckingCache: true,
          isPrefetching: true,
          step: ExecutionStep.PREPARING_MODEL,
          isModelCached: true,
        }),
      ).toBe(CacheStateEnum.CHECKING);

      expect(
        CacheStateManager.derive({
          isCheckingCache: false,
          isPrefetching: true,
          step: ExecutionStep.PREPARING_MODEL,
          isModelCached: true,
        }),
      ).toBe(CacheStateEnum.SYNCING);

      expect(
        CacheStateManager.derive({
          isCheckingCache: false,
          isPrefetching: false,
          step: ExecutionStep.PREPARING_MODEL,
          isModelCached: true,
        }),
      ).toBe(CacheStateEnum.LOADING);

      expect(
        CacheStateManager.derive({
          isCheckingCache: false,
          isPrefetching: false,
          step: ExecutionStep.IDLE,
          isModelCached: true,
        }),
      ).toBe(CacheStateEnum.READY);

      expect(
        CacheStateManager.derive({
          isCheckingCache: false,
          isPrefetching: false,
          step: ExecutionStep.IDLE,
          isModelCached: false,
        }),
      ).toBe(CacheStateEnum.DOWNLOAD);
    });
  });

  describe('getConfig', () => {
    const mockT = (key: string) => `translated_${key}`;

    it('should return config for CHECKING state', () => {
      const config = CacheStateManager.getConfig(CacheStateEnum.CHECKING, mockT);
      expect(config.type).toBe('display');
      expect(config.icon).toBe('spinner');
      expect(config.label).toBe('translated_ui.checking');
    });

    it('should return config for READY state', () => {
      const config = CacheStateManager.getConfig(CacheStateEnum.READY, mockT);
      expect(config.type).toBe('display');
      expect(config.icon).toBe('check');
      expect(config.label).toBe('translated_ui.optimized_ready');
    });

    it('should return config for SYNCING state', () => {
      const config = CacheStateManager.getConfig(CacheStateEnum.SYNCING, mockT);
      expect(config.type).toBe('button');
      expect(config.icon).toBe('spinner');
      expect(config.label).toBe('translated_ui.syncing');
    });

    it('should return config for LOADING state', () => {
      const config = CacheStateManager.getConfig(CacheStateEnum.LOADING, mockT);
      expect(config.type).toBe('button');
      expect(config.icon).toBe('spinner');
      expect(config.label).toBe('translated_ui.loading');
    });

    it('should return config for DOWNLOAD state', () => {
      const config = CacheStateManager.getConfig(CacheStateEnum.DOWNLOAD, mockT);
      expect(config.type).toBe('button');
      expect(config.icon).toBe('download');
      expect(config.label).toBe('translated_ui.download');
    });

    it('should call translation function with correct keys', () => {
      const mockTFunction = vi.fn((key: string) => `translated_${key}`);
      CacheStateManager.getConfig(CacheStateEnum.CHECKING, mockTFunction);
      expect(mockTFunction).toHaveBeenCalledWith('ui.checking');
    });

    it('should handle all states without errors', () => {
      const states = Object.values(CacheStateEnum);
      states.forEach((state) => {
        const config = CacheStateManager.getConfig(state, mockT);
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('label');
        expect(['display', 'button']).toContain(config.type);
        expect(['spinner', 'check', 'download']).toContain(config.icon);
      });
    });
  });

  describe('isInteractive', () => {
    it('should return true for interactive states', () => {
      expect(CacheStateManager.isInteractive(CacheStateEnum.DOWNLOAD)).toBe(true);
      expect(CacheStateManager.isInteractive(CacheStateEnum.READY)).toBe(true);
    });

    it('should return false for non-interactive states', () => {
      expect(CacheStateManager.isInteractive(CacheStateEnum.CHECKING)).toBe(false);
      expect(CacheStateManager.isInteractive(CacheStateEnum.SYNCING)).toBe(false);
      expect(CacheStateManager.isInteractive(CacheStateEnum.LOADING)).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should return true for loading states', () => {
      expect(CacheStateManager.isLoading(CacheStateEnum.CHECKING)).toBe(true);
      expect(CacheStateManager.isLoading(CacheStateEnum.SYNCING)).toBe(true);
      expect(CacheStateManager.isLoading(CacheStateEnum.LOADING)).toBe(true);
    });

    it('should return false for non-loading states', () => {
      expect(CacheStateManager.isLoading(CacheStateEnum.READY)).toBe(false);
      expect(CacheStateManager.isLoading(CacheStateEnum.DOWNLOAD)).toBe(false);
    });
  });
});
