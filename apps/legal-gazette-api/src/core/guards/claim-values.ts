const stringItems = (value: unknown[]): string[] =>
  value.filter((item): item is string => typeof item === 'string')

/**
 * `scope` as a list. IDS emits several scopes as an array, and a scope string
 * is space-delimited (RFC 6749 §3.3); anything else reads as no scopes.
 */
export const scopeValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return stringItems(value)
  }

  return typeof value === 'string' ? value.split(' ').filter(Boolean) : []
}

/**
 * `aud` as a list. Several audiences come as an array; a string is one
 * audience, never split (RFC 7519 §4.1.3), so `"x <client>"` does not name
 * `<client>`. Anything else reads as no audience.
 */
export const audienceValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return stringItems(value)
  }

  return typeof value === 'string' ? [value] : []
}
