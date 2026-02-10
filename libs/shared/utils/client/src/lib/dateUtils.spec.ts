import {
  addBusinessDays,
  getHolidaysForYear,
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
  getValidPublishingDatesInRange,
  isDateOnWeekendOrHoliday,
  isValidPublishingDate,
} from './dateUtils'

describe('dateUtils', () => {
  describe('getHolidaysForYear', () => {
    it('should return holidays for a given year', () => {
      const holidays2024 = getHolidaysForYear(2024)
      expect(holidays2024).toBeDefined()
      expect(holidays2024.length).toBeGreaterThan(0)
    })
  })

  describe('isDateOnWeekendOrHoliday', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2024-01-06') // A known Saturday
      expect(isDateOnWeekendOrHoliday(saturday)).toBe(true)
    })

    it('should return true for Sunday', () => {
      const sunday = new Date('2024-01-07') // A known Sunday
      expect(isDateOnWeekendOrHoliday(sunday)).toBe(true)
    })

    it('should return false for a regular weekday', () => {
      const monday = new Date('2024-01-08') // A known Monday (not holiday)
      expect(isDateOnWeekendOrHoliday(monday)).toBe(false)
    })

    it("should return true for New Year's Day", () => {
      const newYear = new Date('2024-01-01')
      expect(isDateOnWeekendOrHoliday(newYear)).toBe(true)
    })
  })

  describe('isValidPublishingDate', () => {
    it('should return true for regular weekdays', () => {
      const monday = new Date('2024-01-08')
      expect(isValidPublishingDate(monday)).toBe(true)
    })

    it('should return false for weekends', () => {
      const saturday = new Date('2024-01-06')
      const sunday = new Date('2024-01-07')
      expect(isValidPublishingDate(saturday)).toBe(false)
      expect(isValidPublishingDate(sunday)).toBe(false)
    })

    it('should return false for holidays', () => {
      const newYear = new Date('2024-01-01')
      expect(isValidPublishingDate(newYear)).toBe(false)
    })
  })

  describe('addBusinessDays', () => {
    it('should add business days correctly', () => {
      const friday = new Date('2024-01-12') // Friday
      const result = addBusinessDays(friday, 3)

      // Should be Wednesday (skipping weekend)
      expect(result.getDate()).toBe(17) // Next Wednesday
      expect(result.getDay()).toBe(3) // Wednesday
    })

    it('should handle holidays correctly', () => {
      const beforeNewYear = new Date('2023-12-29') // Friday before New Year
      const result = addBusinessDays(beforeNewYear, 1)

      // Should skip New Year's Day (holiday) and weekend
      expect(result.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime())
    })
  })

  describe('getValidPublishingDatesInRange', () => {
    it('should return only valid publishing dates in range', () => {
      const startDate = new Date('2024-01-08') // Monday
      const endDate = new Date('2024-01-14') // Sunday

      const validDates = getValidPublishingDatesInRange(startDate, endDate)

      // Should include Mon-Fri (5 days) if no holidays
      expect(validDates.length).toBeLessThanOrEqual(5)

      // All returned dates should be valid
      validDates.forEach((date) => {
        expect(isValidPublishingDate(date)).toBe(true)
      })
    })

    it('should exclude weekends from the range', () => {
      const startDate = new Date('2024-01-06') // Saturday
      const endDate = new Date('2024-01-07') // Sunday

      const validDates = getValidPublishingDatesInRange(startDate, endDate)

      expect(validDates.length).toBe(0)
    })
  })

  describe('getInvalidPublishingDatesInRange', () => {
    it('should return only invalid publishing dates in range', () => {
      const startDate = new Date('2024-01-08') // Monday
      const endDate = new Date('2024-01-14') // Sunday

      const invalidDates = getInvalidPublishingDatesInRange(startDate, endDate)

      // Should include weekend days (Saturday and Sunday)
      expect(invalidDates.length).toBeGreaterThanOrEqual(2)

      // All returned dates should be invalid (weekends or holidays)
      invalidDates.forEach((date) => {
        expect(isValidPublishingDate(date)).toBe(false)
      })
    })

    it('should return only weekends when range contains only weekends', () => {
      const startDate = new Date('2024-01-06') // Saturday
      const endDate = new Date('2024-01-07') // Sunday

      const invalidDates = getInvalidPublishingDatesInRange(startDate, endDate)

      expect(invalidDates.length).toBe(2)
      expect(invalidDates[0].getDay()).toBe(6) // Saturday
      expect(invalidDates[1].getDay()).toBe(0) // Sunday
    })

    it('should return empty array when range contains only valid dates', () => {
      const startDate = new Date('2024-01-08') // Monday
      const endDate = new Date('2024-01-10') // Wednesday

      const invalidDates = getInvalidPublishingDatesInRange(startDate, endDate)

      // Should be empty if no holidays fall within this range
      expect(invalidDates.length).toBe(0)
    })

    it("should include New Year's Day in invalid dates", () => {
      const startDate = new Date('2023-12-31') // Sunday
      const endDate = new Date('2024-01-02') // Tuesday

      const invalidDates = getInvalidPublishingDatesInRange(startDate, endDate)

      // Should include Sunday (Dec 31) and New Year's Day (Jan 1)
      expect(invalidDates.length).toBeGreaterThanOrEqual(2)

      // Check that New Year's Day is included
      const newYearIncluded = invalidDates.some(
        (date) =>
          date.getMonth() === 0 &&
          date.getDate() === 1 &&
          date.getFullYear() === 2024,
      )
      expect(newYearIncluded).toBe(true)
    })

    it('should be the complement of getValidPublishingDatesInRange', () => {
      const startDate = new Date('2024-01-06') // Saturday
      const endDate = new Date('2024-01-14') // Sunday

      const validDates = getValidPublishingDatesInRange(startDate, endDate)
      const invalidDates = getInvalidPublishingDatesInRange(startDate, endDate)

      // Total dates should equal the range (9 days)
      const totalDays =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1
      expect(validDates.length + invalidDates.length).toBe(totalDays)

      // No overlap between valid and invalid dates
      const allDates = [...validDates, ...invalidDates]
      const uniqueDates = new Set(allDates.map((d) => d.getTime()))
      expect(uniqueDates.size).toBe(allDates.length)
    })
  })

  describe('getNextValidPublishingDate (legacy function)', () => {
    it('should work as before for backward compatibility', () => {
      const mondayMorning = new Date('2024-01-08T10:00:00')
      const result = getNextValidPublishingDate(mondayMorning)

      expect(result.getDate()).toBe(mondayMorning.getDate())
      expect(result.getMonth()).toBe(mondayMorning.getMonth())
      expect(result.getFullYear()).toBe(mondayMorning.getFullYear())
    })

    it('should only apply 12:00 time check when the date is today', () => {
      // Test the behavior by comparing results for the same future date at different times
      // Since it's not "today", the time shouldn't matter

      const futureDate = new Date('2024-01-15') // Monday (should be a valid weekday)

      // Create two versions of the same future date with different times
      const futureMorning = new Date('2024-01-15T10:00:00') // 10 AM
      const futureAfternoon = new Date('2024-01-15T14:00:00') // 2 PM

      const resultMorning = getNextValidPublishingDate(futureMorning)
      const resultAfternoon = getNextValidPublishingDate(futureAfternoon)

      // Both should give the same result since time check shouldn't apply to future dates
      // If the date is a valid publishing date, both should return the same date
      if (isValidPublishingDate(futureDate)) {
        expect(resultMorning.getDate()).toBe(15)
        expect(resultAfternoon.getDate()).toBe(15)
        expect(resultMorning.getMonth()).toBe(resultAfternoon.getMonth())
        expect(resultMorning.getDate()).toBe(resultAfternoon.getDate())
      } else {
        // If it's not valid (weekend/holiday), both should find the same next valid date
        expect(resultMorning.getTime()).toBe(resultAfternoon.getTime())
      }
    })

    it('should handle future dates without time restrictions', () => {
      // For future dates (not "today"), time should not matter
      const futureDate = new Date('2024-01-10T10:00:00') // Wednesday morning

      // Only test if this is actually a valid publishing date
      if (isValidPublishingDate(new Date('2024-01-10'))) {
        const result = getNextValidPublishingDate(futureDate)

        // Should return the same date since it's valid and not "today"
        expect(result.getDate()).toBe(10)
        expect(result.getMonth()).toBe(0) // January (0-indexed)
        expect(result.getFullYear()).toBe(2024)
      }
    })
  })
})
