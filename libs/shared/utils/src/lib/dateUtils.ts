import { getHolidays, Holiday } from 'fridagar'

// The pattern is, if now is before noon, then you can choose today as publishing date else you have to choose at least tomorrow
// We have to exclude weeknds as publishing dates are only on weekdays and we must account for holidays as well
// There are two different types (atleast for legal gazette) of adverts that will have to use this and the logic might differ slightly
// For all adverts except when "Skiptafundur" the default is now < 12:00 -> today else next workday
// For "Skiptafundur" the first one can be any day, if there are multiple "Skiptafundur" adverts then the next one has to be at least 2 months and 1 weeks later
export const getHolidaysForYear = (year: number): Holiday[] => {
  return getHolidays(year)
}

export const isDateOnWeekendOrHoliday = (date: Date = new Date()) => {
  const day = date.getDay()
  const isWeekend = day === 0 || day === 6 // 0 = Sunday, 6 = Saturday

  if (isWeekend) {
    return true
  }

  // Get holidays for the specific year of the date being checked
  const holidays = getHolidays(date.getFullYear())
  const isHoliday = holidays.some(
    (holiday) =>
      holiday.date.getDate() === date.getDate() &&
      holiday.date.getMonth() === date.getMonth() &&
      holiday.date.getFullYear() === date.getFullYear(),
  )

  return isHoliday
}

export const getNextValidPublishingDate = (
  fromDate: Date | undefined = new Date(),
) => {
  const nextDate = new Date(fromDate)
  const today = new Date()

  // Only check time if the date being checked is today
  const isToday =
    fromDate.getDate() === today.getDate() &&
    fromDate.getMonth() === today.getMonth() &&
    fromDate.getFullYear() === today.getFullYear()

  // If it's today and time is after 12:00, start checking from the next day
  if (isToday && fromDate.getHours() >= 12) {
    nextDate.setDate(nextDate.getDate() + 1)
  }

  // Loop until we find a valid date
  while (isDateOnWeekendOrHoliday(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1)
  }

  return nextDate
}

/**
 * Check if a given date is a valid publishing date (weekday and not holiday)
 */
export const isValidPublishingDate = (date: Date): boolean => {
  return !isDateOnWeekendOrHoliday(date)
}

/**
 * Add business days to a date (skipping weekends and holidays)
 */
export const addBusinessDays = (fromDate: Date, days: number): Date => {
  const result = new Date(fromDate)
  let daysAdded = 0

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1)
    if (!isDateOnWeekendOrHoliday(result)) {
      daysAdded++
    }
  }

  return result
}

/**
 * Get all valid publishing dates in a date range
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @return An array of valid publishing dates within the range
 */
export const getValidPublishingDatesInRange = (
  startDate: Date,
  endDate: Date,
): Date[] => {
  const dates: Date[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    if (isValidPublishingDate(current)) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Get all invalid publishing dates in a date range (weekends and holidays)
 * This is useful for excluding dates in date pickers
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @return An array of invalid publishing dates (weekends and holidays) within the range
 */
export const getInvalidPublishingDatesInRange = (
  startDate: Date,
  endDate: Date,
): Date[] => {
  const dates: Date[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    if (!isValidPublishingDate(current)) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}
