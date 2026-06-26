/**
 * Salary-report renewal window.
 *
 * Salary reports (launagreining) run on a 3-year cadence. A company may only
 * submit a NEW salary report once its current one is "due in 6 months or less"
 * — i.e. it cannot renew too early. The due date is read from
 * `company.next_salary_report_due_at` (the regulatory due date, seeded for the
 * launch cohort and thereafter advanced by the approval flow).
 *
 * Edge cases (both allowed):
 *   - `dueAt == null` → no known obligation / first-timer → eligible.
 *   - `dueAt` already in the past (overdue) → eligible.
 *
 * Blocked only when the due date is strictly more than the window out.
 */
export const SALARY_RENEWAL_WINDOW_MONTHS = 6

export enum SalaryReportEligibilityReasonEnum {
  /** Due date is more than `SALARY_RENEWAL_WINDOW_MONTHS` months away. */
  RENEWAL_WINDOW_NOT_OPEN = 'RENEWAL_WINDOW_NOT_OPEN',
}

export interface SalaryRenewalEligibility {
  eligible: boolean
  reason: SalaryReportEligibilityReasonEnum | null
  dueAt: Date | null
  /**
   * The earliest moment the company may submit (`dueAt` minus the window).
   * Null only when there is no due date to anchor on.
   */
  earliestSubmissionDate: Date | null
}

/**
 * Pure renewal-window decision. `now` is injected so the rule is deterministic
 * and unit-testable.
 */
export function evaluateSalaryRenewalEligibility(
  dueAt: Date | null,
  now: Date,
): SalaryRenewalEligibility {
  if (dueAt === null) {
    return {
      eligible: true,
      reason: null,
      dueAt: null,
      earliestSubmissionDate: null,
    }
  }

  const earliestSubmissionDate = new Date(dueAt)
  earliestSubmissionDate.setMonth(
    earliestSubmissionDate.getMonth() - SALARY_RENEWAL_WINDOW_MONTHS,
  )

  // Window is open once we've reached the earliest date (inclusive). An overdue
  // due date (in the past) trivially satisfies this and stays eligible.
  if (now.getTime() >= earliestSubmissionDate.getTime()) {
    return {
      eligible: true,
      reason: null,
      dueAt,
      earliestSubmissionDate,
    }
  }

  return {
    eligible: false,
    reason: SalaryReportEligibilityReasonEnum.RENEWAL_WINDOW_NOT_OPEN,
    dueAt,
    earliestSubmissionDate,
  }
}
