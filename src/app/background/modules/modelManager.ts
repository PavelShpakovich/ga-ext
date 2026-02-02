/**
 * @module ModelManager
 * Enhanced provider factory with alarm-based idle timeout and memory management.
 * Uses chrome.alarms API for more reliable service worker lifecycle management.
 */

import { Logger } from '@/core/services/Logger';
import { ProviderFactory, setActivityCallback, setModelLoadedCallback } from '@/core/providers';

const ALARM_NAME = 'model-idle-timer';
const IDLE_TIMEOUT_MINUTES = 10;

/**
 * Last activity timestamp
 */
let lastActivityTimestamp: number = Date.now();

/**
 * Mark activity to reset idle timer
 */
export function markModelActivity(): void {
  lastActivityTimestamp = Date.now();
  Logger.debug('ModelManager', 'Model activity marked', {
    timestamp: lastActivityTimestamp,
  });
}

/**
 * Check if model should be unloaded due to inactivity
 */
async function checkIdleTimeout(): Promise<void> {
  const idleMilliseconds = Date.now() - lastActivityTimestamp;
  const idleMinutes = idleMilliseconds / (60 * 1000);

  Logger.debug('ModelManager', 'Idle check', {
    idleMinutes: idleMinutes.toFixed(2),
    threshold: IDLE_TIMEOUT_MINUTES,
  });

  if (idleMinutes >= IDLE_TIMEOUT_MINUTES) {
    Logger.debug('ModelManager', 'Unloading models due to inactivity');
    await ProviderFactory.clearInstances();

    // Cancel alarm after unload
    if (chrome.alarms) {
      chrome.alarms.clear(ALARM_NAME);
    }
  }
}

/**
 * Setup alarm-based idle timeout mechanism
 */
export function initializeIdleTimeout(): void {
  // Check if alarms API is available
  if (!chrome.alarms) {
    Logger.warn('ModelManager', 'chrome.alarms API not available, skipping idle timeout');
    return;
  }

  // Hook into ProviderFactory to track activity
  setActivityCallback(markModelActivity);
  setModelLoadedCallback(startIdleMonitoring);

  // Listen to alarm events
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
      checkIdleTimeout();
    }
  });

  Logger.debug('ModelManager', 'Idle timeout initialized', {
    intervalMinutes: IDLE_TIMEOUT_MINUTES,
  });
}

/**
 * Start idle timeout monitoring
 * Should be called when a model is first loaded
 */
export function startIdleMonitoring(): void {
  if (!chrome.alarms) {
    return;
  }

  // Create periodic alarm (checks every minute)
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 1,
  });

  markModelActivity();
  Logger.debug('ModelManager', 'Idle monitoring started');
}

/**
 * Stop idle timeout monitoring
 * Should be called when models are manually unloaded
 */
export function stopIdleMonitoring(): void {
  if (!chrome.alarms) {
    return;
  }

  chrome.alarms.clear(ALARM_NAME);
  Logger.debug('ModelManager', 'Idle monitoring stopped');
}

/**
 * Memory pressure handling
 * Unload models when system memory is low
 */
async function handleMemoryPressure(level: string): Promise<void> {
  if (level === 'critical') {
    Logger.warn('ModelManager', 'Critical memory pressure, unloading models');
    await ProviderFactory.clearInstances();
    stopIdleMonitoring();
  }
}

/**
 * Initialize memory pressure monitoring
 * Note: Chrome system.memory API is experimental and may not be available
 */
export function initializeMemoryMonitoring(): void {
  // Check if the experimental API is available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const systemMemory = (chrome as any).system?.memory;

  if (systemMemory && typeof systemMemory.getInfo === 'function') {
    // Listen for memory changes (experimental API)
    if (systemMemory.onChanged) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      systemMemory.onChanged.addListener((info: any) => {
        Logger.debug('ModelManager', 'Memory pressure changed', { level: info.level });
        handleMemoryPressure(info.level);
      });

      Logger.debug('ModelManager', 'Memory monitoring initialized');
    } else {
      Logger.debug('ModelManager', 'Memory monitoring API not available (onChanged missing)');
    }
  } else {
    Logger.debug('ModelManager', 'Memory monitoring API not available');
  }
}
