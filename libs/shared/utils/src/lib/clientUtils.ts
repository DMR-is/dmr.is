import format from 'date-fns/format'
import is from 'date-fns/locale/is'

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

const dateFormats = [
  'd.MM.yyyy',
  'dd.MM.yyyy',
  'dd. MMMM yyyy',
  'HH:mm',
  'MMMM',
  'EEEE',
] as const

export const formatDate = (
  date: Date | string,
  dateFormat: (typeof dateFormats)[number] = 'dd.MM.yyyy',
  locale = is,
) => {
  const dateToFormat = typeof date === 'string' ? new Date(date) : date

  if (dateToFormat instanceof Date && !isNaN(dateToFormat.getTime())) {
    return format(dateToFormat, dateFormat, { locale })
  }

  throw new Error(`Invalid date: ${date}`)
}

export const numberFormat = (value: number): string =>
  value
    .toString()
    .split('.')[0]
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const amountFormat = (value?: number | string | null): string => {
  const inputValue = typeof value === 'string' ? parseInt(value) : value
  if (inputValue === undefined || inputValue === null || isNaN(inputValue)) {
    return ''
  }
  return typeof inputValue === 'number' ? numberFormat(inputValue) + ' kr.' : ''
}

export const getDaysAgo = (date: string | Date): number => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - dateToUse.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export function getIcelandicDative(days: number) {
  // Check if the number ends in 1 but is not 11
  if (days % 10 === 1 && days % 100 !== 11) {
    return 'degi'
  }
  return 'dögum'
}
