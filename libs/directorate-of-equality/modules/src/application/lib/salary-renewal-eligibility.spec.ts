import {
  evaluateSalaryRenewalEligibility,
  SalaryReportEligibilityReasonEnum,
} from './salary-renewal-eligibility'

describe('salary-renewal-eligibility', () => {
  describe('evaluateSalaryRenewalEligibility', () => {
    const now = new Date('2026-06-24T00:00:00.000Z')

    it('allows when there is no due date (first-timer / no obligation)', () => {
      const result = evaluateSalaryRenewalEligibility(null, now)

      expect(result).toEqual({
        eligible: true,
        reason: null,
        dueAt: null,
        earliestSubmissionDate: null,
      })
    })

    it('allows when the due date is in the past (overdue)', () => {
      const dueAt = new Date('2026-01-01T00:00:00.000Z')

      const result = evaluateSalaryRenewalEligibility(dueAt, now)

      expect(result.eligible).toBe(true)
      expect(result.reason).toBeNull()
    })

    it('allows when the due date is exactly 6 months away (inclusive boundary)', () => {
      // now + 6 months = 2026-12-24.
      const dueAt = new Date('2026-12-24T00:00:00.000Z')

      const result = evaluateSalaryRenewalEligibility(dueAt, now)

      expect(result.eligible).toBe(true)
      expect(result.reason).toBeNull()
    })

    it('allows when the due date is well within the window', () => {
      const dueAt = new Date('2026-09-01T00:00:00.000Z')

      const result = evaluateSalaryRenewalEligibility(dueAt, now)

      expect(result.eligible).toBe(true)
    })

    it('blocks when the due date is more than 6 months away', () => {
      // now + 6 months + 1 day = 2026-12-25.
      const dueAt = new Date('2026-12-25T00:00:00.000Z')

      const result = evaluateSalaryRenewalEligibility(dueAt, now)

      expect(result.eligible).toBe(false)
      expect(result.reason).toBe(
        SalaryReportEligibilityReasonEnum.RENEWAL_WINDOW_NOT_OPEN,
      )
      expect(result.dueAt).toEqual(dueAt)
      // earliest = dueAt - 6 months = 2026-06-25 (one day after `now`).
      expect(result.earliestSubmissionDate).toEqual(
        new Date('2026-06-25T00:00:00.000Z'),
      )
    })
  })
})
