import format from 'date-fns/format'
import is from 'date-fns/locale/is'

export const formatDate = (date: string | Date): string => {
  const dateToUse = new Date(date)

  return format(dateToUse, 'dd. MMMM yyyy', {
    locale: is,
  })
}

export const isDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime())
}

// Gets base url from server side environment variables
// Strips http:// and https:// from the url
export const getBaseUrlFromServerSide = (includePrefix = false): string => {
  const url = process.env.BASE_URL!
  return includePrefix ? url : url.replace(/^https?:\/\//, '')
}
