/**
 * Escapes HTML special characters to prevent XSS attacks.
 *
 * This function converts HTML special characters to their corresponding HTML entities,
 * preventing them from being interpreted as HTML when rendered in a browser.
 *
 * Use this for plain text fields that will be interpolated into HTML templates.
 *
 * @param unsafe - The string that may contain unsafe HTML characters
 * @returns The escaped string with HTML entities, or undefined/null if input is undefined/null
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * escapeHtml('Company & Sons')
 * // Returns: 'Company &amp; Sons'
 *
 * escapeHtml(undefined)
 * // Returns: undefined
 * ```
 */
export function escapeHtml(
  unsafe: string | null | undefined,
): string | null | undefined {
  if (unsafe === null) return null
  if (unsafe === undefined) return undefined

  return unsafe
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
