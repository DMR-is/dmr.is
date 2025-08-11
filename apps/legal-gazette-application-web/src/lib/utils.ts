import addYears from 'date-fns/addYears'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { DateFormats, FormTypes } from './constants'

export const formatDate = (date: string | Date): string => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date

  return format(dateToUse, DateFormats.LONG, { locale: is })
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
