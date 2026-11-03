import { describe, it, expect, vi, afterEach } from 'vitest';
import Logger, { LogLevel, type LogEntry } from '../../src/logger/Logger';

describe('Logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes styled messages to the console method matching the level', () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    new Logger({ scope: 'cart', enabled: true }).info('ready', { items: 2 });

    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(consoleInfo.mock.calls[0][0]).toContain('🧩 cart');
    expect(consoleInfo.mock.calls[0][0]).toContain('ready');
    expect(consoleInfo.mock.calls[0]).toContainEqual({ items: 2 });
  });

  it('notifies entry listeners with level, scope and details', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logger = new Logger({ scope: 'cart', enabled: true });
    const entries: LogEntry[] = [];
    logger.onEntry(entry => entries.push(entry));

    logger.warn('almost full', 9);

    expect(entries).toEqual([expect.objectContaining({ level: LogLevel.Warn, scope: 'cart', message: 'almost full', details: 9 })]);
  });

  it('shares entry listeners with scoped children', () => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    const logger = new Logger({ enabled: true });
    const scopes: string[] = [];
    logger.onEntry(entry => scopes.push(entry.scope));

    logger.withScope('events').debug('emitted');

    expect(scopes).toEqual(['events']);
  });

  it('stays silent when disabled', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = new Logger({ enabled: false });
    const listener = vi.fn();
    logger.onEntry(listener);

    logger.error('boom');

    expect(consoleError).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying a listener after unsubscribe', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = new Logger({ enabled: true });
    const listener = vi.fn();
    const unsubscribe = logger.onEntry(listener);

    unsubscribe();
    logger.info('ignored');

    expect(listener).not.toHaveBeenCalled();
  });
});
