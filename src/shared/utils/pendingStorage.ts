/**
 * @module PendingStorage
 * Utilities for managing temporary data transfer between extension contexts.
 * Uses session storage with TTL (time-to-live) to pass text and error payloads
 * from background/content scripts to the UI with automatic expiration.
 */

import { STORAGE_KEYS, PENDING_TTL_MS } from '@/core/constants';

/**
 * Shared types for pending payload transfer between background and UI contexts
 */
export type PendingTextPayload = {
  value: string;
  autoRun?: boolean;
  ts: number;
};

export type PendingErrorPayload = {
  value: string;
  ts: number;
};

/**
 * Get session storage or fallback to local storage for older Chrome versions
 */
export const getSessionStorage = (): chrome.storage.StorageArea => {
  const storageAny = chrome.storage as unknown as {
    session?: chrome.storage.StorageArea;
    local: chrome.storage.StorageArea;
  };
  return storageAny.session || chrome.storage.local;
};

/**
 * Check if a payload timestamp has expired
 */
export const isPayloadExpired = (ts: number): boolean => {
  return Date.now() - ts > PENDING_TTL_MS;
};

/**
 * Type guard for pending text payload
 */
export const isPendingTextPayload = (payload: unknown): payload is PendingTextPayload =>
  !!payload && typeof payload === 'object' && 'value' in payload;

/**
 * Type guard for pending error payload
 */
export const isPendingErrorPayload = (payload: unknown): payload is PendingErrorPayload =>
  !!payload && typeof payload === 'object' && 'value' in payload;

/**
 * Set pending text with autoRun flag
 */
export const setPendingText = async (text: string, autoRun: boolean): Promise<void> => {
  const storage = getSessionStorage();
  const payload: PendingTextPayload = { value: text, autoRun, ts: Date.now() };
  await storage.set({ [STORAGE_KEYS.PENDING_TEXT]: payload });
};

/**
 * Set pending error message
 */
export const setPendingError = async (error: string): Promise<void> => {
  const storage = getSessionStorage();
  const payload: PendingErrorPayload = { value: error, ts: Date.now() };
  await storage.set({ [STORAGE_KEYS.PENDING_ERROR]: payload });
};

/**
 * Clear stale pending payloads based on TTL
 */
export const clearStalePending = async (): Promise<void> => {
  const storage = getSessionStorage();
  const result = await storage.get([STORAGE_KEYS.PENDING_TEXT, STORAGE_KEYS.PENDING_ERROR]);
  const now = Date.now();

  const maybeText = result[STORAGE_KEYS.PENDING_TEXT] as PendingTextPayload | string | undefined;
  const maybeError = result[STORAGE_KEYS.PENDING_ERROR] as PendingErrorPayload | string | undefined;

  const staleKeys: string[] = [];

  if (typeof maybeText === 'string') {
    staleKeys.push(STORAGE_KEYS.PENDING_TEXT);
  } else if (maybeText && typeof maybeText === 'object' && 'ts' in maybeText && now - maybeText.ts > PENDING_TTL_MS) {
    staleKeys.push(STORAGE_KEYS.PENDING_TEXT);
  }

  if (typeof maybeError === 'string') {
    staleKeys.push(STORAGE_KEYS.PENDING_ERROR);
  } else if (
    maybeError &&
    typeof maybeError === 'object' &&
    'ts' in maybeError &&
    now - maybeError.ts > PENDING_TTL_MS
  ) {
    staleKeys.push(STORAGE_KEYS.PENDING_ERROR);
  }

  if (staleKeys.length > 0) {
    await storage.remove(staleKeys);
  }
};
