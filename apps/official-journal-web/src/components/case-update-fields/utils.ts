import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { getHolidays, Holiday } from 'fridagar'

import { toISODate } from '@island.is/regulations-tools/utils'

export const MINIMUM_WEEKDAYS = 10
type IsHolidayMap = Record<string, true | undefined>
const holidayCache: Record<number, IsHolidayMap | undefined> = {}

const getHolidayMap = (year: number): IsHolidayMap => {
  let yearHolidays = holidayCache[year]
  if (!yearHolidays) {
    const holidayMap: IsHolidayMap = {}
    getHolidays(year).forEach((holiday) => {
      holidayMap[toISODate(holiday.date)] = true
    })
    yearHolidays = holidayCache[year] = holidayMap
  }
  return yearHolidays
}
const isWorkday = (date: Date): boolean => {
  const wDay = date.getDay()
  if (wDay === 0 || wDay === 6) {
    return false
  }
  const holidays = getHolidayMap(date.getFullYear())
  return holidays[toISODate(date)] !== true
}
const getNextWorkday = (date: Date) => {
  // Returns the next workday.
  let nextDay = date
  let iterations = 0
  const MAX_ITERATIONS = 30 // Prevent infinite loop
  while (!isWorkday(nextDay) && iterations < MAX_ITERATIONS) {
    nextDay = addDays(nextDay, 1)
    iterations++
  }
  return nextDay
}
const isWeekday = (date: Date) => {
  return isWorkday(date)
}

const addWorkDays = (date: Date, days: number) => {
  let result = new Date(date)
  while (days > 0) {
    result = addDays(result, 1)
    if (isWorkday(result)) {
      days--
    }
  }
  return result
}

const getWeekendDates = (
  startDate = new Date(),
  endDate = addYears(new Date(), 1),
) => {
  const weekdays = []
  let currentDay = startDate
  while (currentDay <= endDate) {
    if (!isWeekday(currentDay)) {
      weekdays.push(currentDay)
    }
    currentDay = addDays(currentDay, 1)
  }
  return weekdays
}

export const getExcludedDates = (
  startDate = new Date(),
  endDate = addYears(new Date(), 1),
) => {
  const currentYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  let holidays: Holiday[] = []
  for (let year = currentYear; year <= endYear; year++) {
    holidays = [...holidays, ...getHolidays(year)]
  }
  const weekendDates = getWeekendDates(startDate, endDate)

  return [
    ...new Set([...weekendDates, ...holidays.map((holiday) => holiday.date)]),
  ]
}

const getDateString = (date: Date) => {
  return date.toISOString().split('T')[0]
}
// Get default date, but push it to the next workday if it is a weekend or holiday
export const getDefaultDate = (requestedDate?: string) => {
  if (!requestedDate) {
    const date = getNextWorkday(addWorkDays(new Date(), MINIMUM_WEEKDAYS))
    return getDateString(date)
  }
  const date = new Date(requestedDate)
  return getDateString(getNextWorkday(date))
}
