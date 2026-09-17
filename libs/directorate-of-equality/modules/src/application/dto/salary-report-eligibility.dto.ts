import {
  ApiBoolean,
  ApiOptionalDateTime,
  ApiOptionalEnum,
} from '@dmr.is/decorators'

import { SalaryReportEligibilityReasonEnum } from '../lib/salary-renewal-eligibility'

/**
 * Verdict for whether a company may submit a salary report right now. Returned
 * by `GET application/reports/salary/eligibility` so the application portal can
 * gate entry into the salary flow, and surfaced (as a 409) when a submission is
 * attempted too early.
 */
export class SalaryReportEligibilityDto {
  @ApiBoolean({
    description: 'Whether the company may submit a salary report right now.',
  })
  eligible!: boolean

  @ApiOptionalEnum(SalaryReportEligibilityReasonEnum, {
    nullable: true,
    description:
      'Machine-readable reason when `eligible` is false; null when eligible. `MISSING_EQUALITY_REPORT` (no approved, in-force equality report — takes priority) or `RENEWAL_WINDOW_NOT_OPEN` (current report due more than 6 months out).',
  })
  reason!: SalaryReportEligibilityReasonEnum | null

  @ApiOptionalDateTime({
    nullable: true,
    // The decorator's default example is a mid-day instant, which is what these
    // two fields are deliberately not. Overridden so the shape the consumer
    // sees is the shape it gets.
    example: '2029-10-03T23:59:59.999Z',
    description:
      "The company's next salary-report due date (`next_salary_report_due_at`). An end-of-day deadline — the company is not late until the named day is over. Null when no obligation is on record.",
  })
  dueAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    example: '2029-04-03T00:00:00.000Z',
    description:
      'Earliest moment the company may submit (due date minus the 6-month window), normalised to 00:00 on that day — the whole of the named date can be filed on. Null when there is no due date to anchor on.',
  })
  earliestSubmissionDate!: Date | null
}
