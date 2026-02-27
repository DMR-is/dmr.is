export function parseDateValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return value
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return value
}
