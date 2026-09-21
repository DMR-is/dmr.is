/**
 * Day boundaries for the deadline dates the report flow writes.
 *
 * These dates are day-granular in every place a human meets them — the
 * approval email's "Samþykktin gildir til", the register's overdue column, the
 * application portal's "frá og með" — but they are stored as instants, so the
 * time of day has to be pinned deliberately. The two kinds normalise in
 * opposite directions:
 *
 *   - A deadline to act BY (`report.valid_until`, and the
 *     `company.next_*_report_due_at` it is mirrored onto) runs to the END of
 *     the day it names. `overdue` is `due_at < NOW()`, so a mid-day timestamp
 *     would make a company late while the day its report still covers has
 *     hours left to run.
 *   - A window OPENING (`SalaryReportEligibilityDto.earliestSubmissionDate`)
 *     starts at the BEGINNING of the day it names, so the whole of the date the
 *     applicant is shown can actually be filed on. Deriving it from a due date
 *     without this would inherit the end-of-day boundary and refuse every
 *     submission on the named day but the last second.
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
