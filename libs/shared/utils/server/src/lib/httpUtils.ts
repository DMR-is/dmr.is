/**
 * HTTP utilities for making fetch requests with automatic timeout.
 *
 * These utilities can be used in both frontend and backend (NestJS) services
 * to ensure all external API calls have proper timeout configuration.
 */

/**
 * Fetch with automatic timeout to prevent hanging requests.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options (headers, method, body, etc.)
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms / 10 seconds)
 * @returns Promise<Response>
 *
 * @example
 * ```ts
 * // Basic GET request
 * const response = await fetchWithTimeout('https://api.example.com/data')
 *
 * // POST request with custom timeout
 * const response = await fetchWithTimeout(
 *   'https://api.example.com/data',
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ data: 'example' })
 *   },
 *   15000 // 15 second timeout
 * )
 * ```
 */
export async function fetchWithTimeout(
  url: string | URL | Request,
  options?: RequestInit,
  timeoutMs = 10000,
): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  })
}

/** RFC 7807-style problem payload returned by most of our upstream APIs. */
interface ProblemDetails {
  title?: string | null
  detail?: string | null
}

/**
 * Extracts a human-readable message from an unknown upstream error payload.
 *
 * Handles the common shapes returned by external APIs: an RFC 7807
 * `problem+json` object (`title`/`detail`) or a plain string. Falls back to a
 * generic message so callers can always surface something safe.
 *
 * @example
 * throw new BadGatewayException(`Lookup failed: ${getApiErrorMessage(error)}`)
 */
export function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  if (typeof error === 'object' && error !== null) {
    const problem = error as ProblemDetails
    return problem.title || problem.detail || 'Unknown error'
  }
  return 'Unknown error'
}
