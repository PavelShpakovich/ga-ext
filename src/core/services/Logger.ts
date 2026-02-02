export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  data?: unknown;
}

// Determine environment safely
const isProduction = process.env.NODE_ENV === 'production';

export class LoggerService {
  private static instance: LoggerService;
  // Default to INFO in production, DEBUG in dev
  private level: LogLevel = isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  private logs: LogEntry[] = [];
  // Reduce memory footprint in production
  private readonly MAX_LOGS = isProduction ? 100 : 1000;

  private constructor() {
    // Default level initialized above based on environment
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public debug(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  public info(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  public warn(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  public error(category: string, message: string, error?: unknown): void {
    this.log(LogLevel.ERROR, category, message, error);
  }

  private log(level: LogLevel, category: string, message: string, data?: unknown): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      category,
      message,
      data,
    };

    // Store in memory for potential export
    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Persist ERRORS to storage (max 50)
    if (level === LogLevel.ERROR) {
      this.persistErrorLog(entry);
    }

    // Console output with styling
    const style = this.getStyle(level);
    const consoleMethod = this.getConsoleMethod(level);

    if (data) {
      consoleMethod(`%c[${category}] ${message}`, style, data);
    } else {
      consoleMethod(`%c[${category}] ${message}`, style);
    }
  }

  private async persistErrorLog(entry: LogEntry): Promise<void> {
    try {
      const sanitized: LogEntry = {
        timestamp: entry.timestamp,
        level: entry.level,
        category: entry.category,
        message: entry.message.length > 500 ? `${entry.message.slice(0, 497)}...` : entry.message,
      };

      // Direct storage access to avoid circular dependency with StorageService
      const result = await chrome.storage.local.get('grammar_assistant_error_logs');
      const errorLogs = result.grammar_assistant_error_logs || [];
      errorLogs.push(sanitized);

      // Keep only last 50 errors to avoid storage quota issues
      if (errorLogs.length > 50) {
        errorLogs.shift();
      }

      await chrome.storage.local.set({ grammar_assistant_error_logs: errorLogs });
    } catch (e) {
      console.error('Failed to persist error log', e);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private getStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #9E9E9E; font-weight: bold';
      case LogLevel.INFO:
        return 'color: #2196F3; font-weight: bold';
      case LogLevel.WARN:
        return 'color: #FF9800; font-weight: bold';
      case LogLevel.ERROR:
        return 'color: #F44336; font-weight: bold';
      default:
        return 'color: inherit';
    }
  }
}

export const Logger = LoggerService.getInstance();
