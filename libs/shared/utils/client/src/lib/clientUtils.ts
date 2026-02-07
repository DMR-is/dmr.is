import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'

export const isSingular = (n: number | string): boolean => {
  const c = '' + Number(n)
  return c.slice(-1) === '1' && c.slice(-2) !== '11'
}

export const isResponse = (error: unknown): error is Response => {
  return typeof error === 'object' && error !== null && 'json' in error
}

export const ICELANDIC_ALPHABET = 'AÁBDÐEÉFGHIÍJKLMNOÓPRSTUÚVXYÝÞÆÖ'

export const sortAlphabetically = (a: string, b: string) => {
  return a.localeCompare(b, 'is', { sensitivity: 'base' })
}

export const deleteUndefined = <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any> | undefined,
): T => {
  if (obj) {
    Object.keys(obj).forEach((key: string) => {
      if (obj[key] && typeof obj[key] === 'object') {
        deleteUndefined(obj[key])
      } else if (typeof obj[key] === 'undefined') {
        delete obj[key]
      }
    })
  }
  return obj as T
}

export const getDaysAgo = (date: string | Date): number => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - dateToUse.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate the difference in calendar days between a date and now.
 * Uses date-fns differenceInCalendarDays to correctly handle same-day times.
 * Positive values mean the date is in the future, negative means past.
 * @param date - The date to compare
 * @returns Number of calendar days (positive for future, negative for past)
 */
export const getDaysDelta = (date: string | Date): number => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  return differenceInCalendarDays(dateToUse, now)
}

export function getIcelandicDative(days: number) {
  // Check if the number ends in 1 but is not 11
  if (days % 10 === 1 && days % 100 !== 11) {
    return 'degi'
  }
  return 'dögum'
}

export const createUrlFromHost = (
  host: string,
  shouldShift: boolean,
  unshift?: string,
) => {
  if (typeof window === 'undefined' || !window.location) {
    return ''
  } else {
    const hostParts = host.split('.')
    if (shouldShift) {
      hostParts.shift()
    }
    if (unshift) {
      hostParts.unshift(unshift)
    }
    return `https://${hostParts.join('.')}`
  }
}
