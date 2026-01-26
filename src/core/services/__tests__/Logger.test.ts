import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from '../Logger';

describe('LoggerService', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Logger.clearLogs();
    Logger.setLevel(LogLevel.DEBUG); // Reset to DEBUG for deterministic tests

    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log debug messages when level is DEBUG', () => {
    Logger.debug('Test', 'Debug message');
    expect(consoleDebugSpy).toHaveBeenCalled();
    expect(Logger.getLogs().length).toBe(1);
  });

  it('should NOT log debug messages when level is INFO', () => {
    Logger.setLevel(LogLevel.INFO);
    Logger.debug('Test', 'Debug message');
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(Logger.getLogs().length).toBe(0);
  });

  it('should log warn messages when level is INFO', () => {
    Logger.setLevel(LogLevel.INFO);
    Logger.warn('Test', 'Warn message');
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(Logger.getLogs().length).toBe(1);
  });

  it('should cap logs size', () => {
    // We can't easily test MAX_LOGS without mocking the private constant or adding 1000 items.
    // But we can verify array behavior.
    for (let i = 0; i < 1100; i++) {
      Logger.info('Test', `Message ${i}`);
    }
    // Assuming default is 1000 or 100
    const logs = Logger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(1000); // Verify it's capped
    expect(logs[logs.length - 1].message).toBe('Message 1099');
  });
});
