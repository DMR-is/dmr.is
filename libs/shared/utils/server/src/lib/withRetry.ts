/**
 * Options for configuring retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Base delay in milliseconds for first retry (default: 1000ms) */
  baseDelayMs?: number
  /** Maximum delay in milliseconds between retries (default: 10000ms) */
  maxDelayMs?: number
  /** Optional callback invoked on each retry attempt */
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Executes an async function with exponential backoff retry logic.
 *
 * Retry delays follow exponential backoff: baseDelayMs * 2^(attempt-1)
 * Example with baseDelayMs=1000: 1s, 2s, 4s, 8s (capped at maxDelayMs)
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function's result
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchDataFromAPI(),
 *   {
 *     maxRetries: 3,
 *     baseDelayMs: 1000,
 *     maxDelayMs: 10000,
 *     onRetry: (attempt, error) => {
 *       logger.warn(`Retry attempt ${attempt}: ${error.message}`)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // If this was the last attempt, throw the error
      if (attempt > maxRetries) {
        throw lastError
      }

      // Calculate exponential backoff delay
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1)
      const delay = Math.min(exponentialDelay, maxDelayMs)

      // Invoke retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // TypeScript exhaustiveness check - should never reach here
  throw lastError!
}
