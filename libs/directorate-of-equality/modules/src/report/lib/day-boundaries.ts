/**
 * Day boundaries for the deadline dates the report flow writes.
 *
 * These dates are day-granular in every place a human meets them — the
 * approval email's "Samþykktin gildir til" and the register's overdue column —
 * but they are stored as instants, so the
 * time of day has to be pinned deliberately. The two kinds normalise in
 * opposite directions:
 *
 *   - A deadline to act BY (`report.valid_until`, and the
 *     `company.next_*_report_due_at` it is mirrored onto) runs to the END of
 *     the day it names. `overdue` is `due_at < NOW()`, so a mid-day timestamp
 *     would make a company late while the day its report still covers has
 *     hours left to run.
 *   - A day the applicant is invited to act ON starts at the BEGINNING of the
 *     day it names, so the whole of the date they are shown is usable. Deriving
 *     such a date from a deadline without this would inherit the end-of-day
 *     boundary and leave only its last second.
 *
 * Iceland is UTC all year, so the UTC day and the Icelandic wall-clock day are
 * the same day. The `setUTC*` variants are used rather than `setHours` so that
 * a machine configured to another timezone cannot shift the boundary.
 *
 * The retired register's load already emits its day cells this way — see
 * `dayToTimestamp` in `scripts/company-register-to-sql.ts` and
 * `legacyValidUntilToDate` in `legacy-equality-coverage.ts`, both `23:59:59`.
 * These helpers are that same rule, for the dates the approval flow writes.
 */

import { REPORT_VALIDITY_YEARS } from '../../constants'

/** The last instant of `date`'s UTC day. */
export function endOfUtcDay(date: Date): Date {
  const result = new Date(date)
  result.setUTCHours(23, 59, 59, 999)

  return result
}

/** The first instant of `date`'s UTC day. */
export function startOfUtcDay(date: Date): Date {
  const result = new Date(date)
  result.setUTCHours(0, 0, 0, 0)

  return result
}

/**
 * How long a report approved at `from` remains valid: three years on, to the
 * end of that day.
 *
 * The single definition of the 3-year cadence. `approve()` writes the result to
 * `report.valid_until` and mirrors it onto `company.next_*_report_due_at`, and
 * `getSalaryReportEligibility` calls it with `now` to tell an applicant what
 * deadline a report filed today would earn. Those two must agree: the portal
 * quotes the figure before submission, and the approval is what makes it true.
 * Computing it twice is how they would come to disagree.
 *
 * ⚠️ `setUTCFullYear`, not `setFullYear`, for the reason the header gives —
 * a machine in another timezone must not shift the boundary. Iceland is UTC, so
 * the two agree wherever this actually runs; using the UTC variant is what keeps
 * that a property of the code rather than of the deployment.
 *
 * A 29 February start lands on 1 March, which is JS date arithmetic doing the
 * ordinary thing and is left alone: it is one day on a three-year deadline, and
 * both callers inherit it identically.
 */
export function computeReportValidUntil(from: Date): Date {
  const validUntilDay = new Date(from)
  validUntilDay.setUTCFullYear(
    validUntilDay.getUTCFullYear() + REPORT_VALIDITY_YEARS,
  )

  return endOfUtcDay(validUntilDay)
}
