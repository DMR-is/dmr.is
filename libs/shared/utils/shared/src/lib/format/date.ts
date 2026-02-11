import format from 'date-fns/format'
import is from 'date-fns/locale/is'

const dateFormats = [
  'd.MM.yyyy',
  'dd.MM.yyyy',
  'd. MMMM yyyy',
  'dd. MMMM yyyy',
  'HH:mm',
  'MMMM',
  'EEEE',
  "dd. MMMM yyyy 'kl.' HH:mm",
  "d.MM.yy 'kl.' HH:mm",
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
