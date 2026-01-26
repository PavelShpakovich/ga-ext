import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock chrome API
(global as unknown as { chrome: typeof chrome }).chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    } as unknown as chrome.storage.LocalStorageArea,
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    } as unknown as chrome.storage.SyncStorageArea,
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as chrome.storage.StorageChangedEvent,
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as chrome.runtime.ExtensionMessageEvent,
    sendMessage: vi.fn(),
    getURL: vi.fn(),
    lastError: undefined,
  } as unknown as typeof chrome.runtime,
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  } as unknown as typeof chrome.tabs,
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    } as unknown as chrome.contextMenus.MenuClickedEvent,
  } as unknown as typeof chrome.contextMenus,
  sidePanel: {
    open: vi.fn(),
  } as unknown as typeof chrome.sidePanel,
  commands: {
    onCommand: {
      addListener: vi.fn(),
    } as unknown as chrome.commands.CommandEvent,
  } as unknown as typeof chrome.commands,
} as typeof chrome;
