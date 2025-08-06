import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { DateFormats } from './constants'

export const formatDate = (date: string | Date): string => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date

  return format(dateToUse, DateFormats.LONG, { locale: is })
}
