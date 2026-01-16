import addYears from 'date-fns/addYears'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'

import { DateFormats, FormTypes } from './constants'

export const mapFormTypeToApplicationType = (
  formType: FormTypes,
): ApplicationTypeEnum => {
  switch (formType) {
    case FormTypes.BANKRUPTCY:
      return ApplicationTypeEnum.RECALL_BANKRUPTCY
    case FormTypes.DECEASED:
      return ApplicationTypeEnum.RECALL_DECEASED
    case FormTypes.COMMON:
      return ApplicationTypeEnum.COMMON
  }
}

export const formatDate = (
  date: string | Date,
  df: DateFormats = DateFormats.LONG,
): string => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date

  return format(dateToUse, df, { locale: is })
}

export const isWeekday = (date: Date): boolean => {
  const day = date.getDay()
  return day !== 0 && day !== 6 // 0 is Sunday, 6 is Saturday
}

export const getNextWeekday = (date: Date): Date => {
  const nextDate = new Date(date)
  if (isWeekday(nextDate)) {
    return nextDate
  }
  nextDate.setDate(nextDate.getDate() + 1)

  while (!isWeekday(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1)
  }

  return nextDate
}

export const getWeekendDays = (
  startDate: Date,
  endDate: Date = addYears(new Date(), 1),
): Date[] => {
  const dates: Date[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    if (!isWeekday(currentDate)) {
      dates.push(new Date(currentDate))
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

export const isValidFormType = (type?: string): boolean => {
  const validTypes = Object.values(FormTypes)
  return validTypes.includes(type as FormTypes)
}

export const getErrors = (
  obj: any,
  path: string[] = [],
): { path: string; errors: string[] }[] => {
  let result: { path: string; errors: string[] }[] = []

  if (obj.errors && obj.errors.length > 0) {
    result.push({ path: path.join('.'), errors: obj.errors })
  }

  if (obj.properties) {
    for (const key in obj.properties) {
      const child = obj.properties[key]
      result = result.concat(getErrors(child, [...path, key]))
    }
  }

  return result
}

export function getDotNotationPaths(
  obj: Record<string, any>,
  prefix = '',
): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      return getDotNotationPaths(value, path)
    }
    return value ? [path] : []
  })
}

// Gets base url from server side environment variables
// Strips http:// and https:// from the url
export const getBaseUrlFromServerSide = (includePrefix = false): string => {
  let url = ''
  if (process.env.NODE_ENV === 'development') {
    url = process.env.LG_APPLICATION_WEB_URL!
  } else {
    url = (process.env.BASE_URL ?? process.env.IDENTITY_SERVER_LOGOUT_URL)! // Fallback to ID server logout URL if BASE_URL is not set yet
  }
  return includePrefix ? url : url.replace(/^https?:\/\//, '')
}
