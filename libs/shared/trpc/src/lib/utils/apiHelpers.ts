type LoggerLike = {
  warn: (message: string, meta?: Record<string, unknown>) => void
}

/**
 * Wraps a promise to return a default value on rejection.
 * Useful for Promise.all where you want to continue even if some promises fail.
 *
 * @example
 * const [types, categories] = await Promise.all([
 *   withDefault(ctx.api.getTypes({}), { types: [] }, logger, 'fetch types'),
 *   withDefault(ctx.api.getCategories({}), { categories: [] }, logger, 'fetch categories'),
 * ])
 */
export function withDefault<T>(
  promise: Promise<T>,
  defaultValue: T,
  logger?: LoggerLike,
  context?: string,
): Promise<T> {
  return promise.catch(async (error) => {
      const err = await error.json().catch(() => null) // Try to parse error body, but ignore if it fails
    if (logger && context) {
      logger.warn(`Failed to ${context}`, { error: err || error })
    }
    return defaultValue
  })
}
