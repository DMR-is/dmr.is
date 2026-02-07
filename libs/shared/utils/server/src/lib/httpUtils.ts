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
