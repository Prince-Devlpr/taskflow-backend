import { config } from '../config/env';

/**
 * Minimal structured security logger.
 *
 * IMPORTANT: never pass passwords, tokens, authorization headers or
 * database credentials into these helpers — only safe, non-sensitive
 * metadata (event name, IP, path, user id, reason).
 */
type LogLevel = 'info' | 'warn' | 'error' | 'security';

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ?? {}),
  };

  // Stay quiet during automated tests to keep output readable.
  if (config.nodeEnv === 'test') return;

  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'security' || level === 'warn') {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
  /** Security-relevant events: failed logins, unauthorized access, rate limits. */
  security: (event: string, meta?: Record<string, unknown>) =>
    emit('security', `security.${event}`, meta),
};
