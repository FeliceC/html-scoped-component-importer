declare const process: { env: { NODE_ENV: string } };

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error'
}

export type LogEntry = {
  level: LogLevel;
  scope: string;
  message: string;
  details?: unknown;
  timestamp: number;
};

type LogEntryListener = (entry: LogEntry) => void;

const LEVEL_STYLES = {
  [LogLevel.Debug]: { emoji: '🔍', color: '#8a8a85' },
  [LogLevel.Info]: { emoji: '✨', color: '#2f6fde' },
  [LogLevel.Warn]: { emoji: '🙈', color: '#c27c0e' },
  [LogLevel.Error]: { emoji: '💥', color: '#d93b3b' }
} as const;

export default class Logger {
  private readonly scope: string;
  private readonly enabled: boolean;
  private readonly entryListeners: Set<LogEntryListener>;

  /**
   * @param options.scope label shown before every message
   * @param options.enabled defaults to true outside production builds
   */
  constructor(options: { scope?: string; enabled?: boolean } = {}, entryListeners: Set<LogEntryListener> = new Set()) {
    this.scope = options.scope ?? 'app';
    this.enabled = options.enabled ?? process.env.NODE_ENV !== 'production';
    this.entryListeners = entryListeners;
  }

  withScope(scope: string): Logger {
    return new Logger({ scope, enabled: this.enabled }, this.entryListeners);
  }

  onEntry(listener: LogEntryListener): () => void {
    this.entryListeners.add(listener);
    return () => this.entryListeners.delete(listener);
  }

  debug(message: string, details?: unknown): void {
    this.write(LogLevel.Debug, message, details);
  }

  info(message: string, details?: unknown): void {
    this.write(LogLevel.Info, message, details);
  }

  warn(message: string, details?: unknown): void {
    this.write(LogLevel.Warn, message, details);
  }

  error(message: string, details?: unknown): void {
    this.write(LogLevel.Error, message, details);
  }

  private write(level: LogLevel, message: string, details?: unknown): void {
    if (!this.enabled) return;

    const entry: LogEntry = { level, scope: this.scope, message, details, timestamp: Date.now() };
    const { emoji, color } = LEVEL_STYLES[level];
    const consoleArguments = [
      '%c🧩 %s%c %s %s',
      `background:${color};color:#fff;border-radius:4px;padding:1px 6px;font-weight:600`,
      this.scope,
      `color:${color}`,
      emoji,
      message
    ];
    // eslint-disable-next-line no-console -- the logger is the single sanctioned console writer
    console[level](...consoleArguments, ...(details === undefined ? [] : [details]));
    this.entryListeners.forEach(listener => listener(entry));
  }
}
