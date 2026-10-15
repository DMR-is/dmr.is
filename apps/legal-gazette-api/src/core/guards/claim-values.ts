/**
 * A multi-valued token claim (`aud`, `scope`) as a list. IDS emits several
 * values as an array but a single value as a space-separated string; anything
 * else reads as no values.
 */
export const claimValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return typeof value === 'string' ? value.split(' ').filter(Boolean) : []
}
