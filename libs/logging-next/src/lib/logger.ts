/* eslint-disable no-console */
import { maskNationalId } from './maskNationalId'
import type { LogEntry, Logger, LogLevel } from './types'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class NextLogger implements Logger {
  private category?: string
  private logLevel: LogLevel

  constructor(category?: string, logLevel: LogLevel = 'info') {
    this.category = category
    this.logLevel = logLevel
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.logLevel]
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): string {
    const entry: LogEntry = {
      level,
      message: maskNationalId(message),
      timestamp: new Date().toISOString(),
      ...(this.category && {
        category: this.category,
        context: this.category,
      }),
      ...meta,
    }

    // In production, output JSON
    if (process.env['NODE_ENV'] === 'production') {
      return JSON.stringify(entry)
    }

    // In development, use readable format
    const prefix = this.category ? `[${this.category}]` : ''
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    return `${entry.timestamp} ${prefix} ${level.toUpperCase()}: ${entry.message}${metaStr}`
  }

  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog(level)) return

    const formatted = this.formatMessage(level, message, meta)

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta)
  }

  child(context: { category: string; context: string }): Logger {
    return new NextLogger(context.category, this.logLevel)
  }
}

export const createLogger = (category?: string): Logger => {
  const logLevel =
    (process.env['LOG_LEVEL'] as LogLevel) ||
    (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug')

  return new NextLogger(category, logLevel)
}

export const getLogger = (category: string): Logger => {
  return createLogger(category)
}
