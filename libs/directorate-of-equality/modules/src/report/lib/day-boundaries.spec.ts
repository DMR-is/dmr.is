import { REPORT_VALIDITY_YEARS } from '../../constants'
import {
  computeReportValidUntil,
  endOfUtcDay,
  startOfUtcDay,
} from './day-boundaries'

describe('day-boundaries', () => {
  describe('endOfUtcDay', () => {
    it('runs to the last millisecond of the UTC day', () => {
      expect(endOfUtcDay(new Date('2026-09-22T09:15:00.000Z'))).toEqual(
        new Date('2026-09-22T23:59:59.999Z'),
      )
    })

    it('leaves the date alone', () => {
      expect(endOfUtcDay(new Date('2026-09-22T00:00:00.000Z'))).toEqual(
        new Date('2026-09-22T23:59:59.999Z'),
      )
    })
  })

  describe('startOfUtcDay', () => {
    it('falls back to the first instant of the UTC day', () => {
      expect(startOfUtcDay(new Date('2026-09-22T23:59:59.999Z'))).toEqual(
        new Date('2026-09-22T00:00:00.000Z'),
      )
    })
  })

  describe('computeReportValidUntil', () => {
    it('runs three years on, to the end of that day', () => {
      expect(
        computeReportValidUntil(new Date('2026-09-22T09:15:00.000Z')),
      ).toEqual(new Date('2029-09-22T23:59:59.999Z'))
    })

    it('does not care what time of day the approval happened', () => {
      const earlyShift = computeReportValidUntil(
        new Date('2026-09-22T00:00:00.000Z'),
      )
      const lateShift = computeReportValidUntil(
        new Date('2026-09-22T23:59:59.999Z'),
      )

      expect(earlyShift).toEqual(lateShift)
    })

    // 29 February has no anniversary in a non-leap year and JS rolls it
    // forward. Pinned rather than worked around: both callers inherit the same
    // answer, and a day either way on a three-year deadline is not worth a
    // special case.
    it('rolls a 29 February start to 1 March', () => {
      expect(
        computeReportValidUntil(new Date('2028-02-29T12:00:00.000Z')),
      ).toEqual(new Date('2031-03-01T23:59:59.999Z'))
    })

    it('honours REPORT_VALIDITY_YEARS rather than a literal', () => {
      const from = new Date('2026-09-22T12:00:00.000Z')

      expect(computeReportValidUntil(from).getUTCFullYear()).toBe(
        from.getUTCFullYear() + REPORT_VALIDITY_YEARS,
      )
    })

    it('does not mutate its argument', () => {
      const from = new Date('2026-09-22T09:15:00.000Z')

      computeReportValidUntil(from)

      expect(from).toEqual(new Date('2026-09-22T09:15:00.000Z'))
    })
  })
})
