import { ExecutionStep } from '@/shared/types';

/**
 * Enum representing different cache states for model loading/caching
 * Used to determine UI display and action availability
 */
export enum CacheStateEnum {
  CHECKING = 'checking',
  READY = 'ready',
  DOWNLOAD = 'download',
  SYNCING = 'syncing',
  LOADING = 'loading',
}

/**
 * Icon type for cache states
 */
export type CacheStateIcon = 'spinner' | 'check' | 'download';

/**
 * Configuration for displaying cache state in UI
 * Contains icon type, label, and display type information
 */
export interface StateConfig {
  type: 'display' | 'button';
  icon: CacheStateIcon;
  label: string;
}

/**
 * Service for managing model cache state machine
 * Centralizes state derivation and configuration logic
 * Reduces duplication in UI components and makes testing easier
 */
export class CacheStateManager {
  /**
   * Derive the current cache state from condition flags
   * @param conditions Object containing boolean condition flags
   * @returns The appropriate CacheStateEnum value
   */
  static derive(conditions: {
    isCheckingCache: boolean;
    isPrefetching: boolean;
    step: ExecutionStep;
    isModelCached: boolean;
  }): CacheStateEnum {
    if (conditions.isCheckingCache) {
      return CacheStateEnum.CHECKING;
    }
    if (conditions.isPrefetching) {
      return CacheStateEnum.SYNCING;
    }
    if (conditions.step === ExecutionStep.PREPARING_MODEL) {
      return CacheStateEnum.LOADING;
    }
    if (conditions.isModelCached) {
      return CacheStateEnum.READY;
    }
    return CacheStateEnum.DOWNLOAD;
  }

  /**
   * Get UI configuration for a given cache state
   * Returns icon type, label, and display type for rendering
   * Component consuming this should map icon types to actual icon components
   *
   * @param state The current cache state
   * @param t Translation function for internationalization
   * @returns StateConfig object for rendering the UI
   */
  static getConfig(state: CacheStateEnum, t: (key: string) => string): StateConfig {
    switch (state) {
      case CacheStateEnum.CHECKING:
        return {
          type: 'display',
          icon: 'spinner',
          label: t('ui.checking'),
        };

      case CacheStateEnum.READY:
        return {
          type: 'display',
          icon: 'check',
          label: t('ui.optimized_ready'),
        };

      case CacheStateEnum.SYNCING:
        return {
          type: 'button',
          icon: 'spinner',
          label: t('ui.syncing'),
        };

      case CacheStateEnum.LOADING:
        return {
          type: 'button',
          icon: 'spinner',
          label: t('ui.loading'),
        };

      case CacheStateEnum.DOWNLOAD:
      default:
        return {
          type: 'button',
          icon: 'download',
          label: t('ui.download'),
        };
    }
  }

  /**
   * Check if a state allows user interaction
   * @param state The cache state to check
   * @returns true if user can interact with cache actions
   */
  static isInteractive(state: CacheStateEnum): boolean {
    return state === CacheStateEnum.READY || state === CacheStateEnum.DOWNLOAD;
  }

  /**
   * Check if a state represents a loading operation
   * @param state The cache state to check
   * @returns true if the state represents an ongoing operation
   */
  static isLoading(state: CacheStateEnum): boolean {
    return [CacheStateEnum.CHECKING, CacheStateEnum.SYNCING, CacheStateEnum.LOADING].includes(state);
  }
}
