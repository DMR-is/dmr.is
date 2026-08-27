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
    description:
      "The company's next salary-report due date (`next_salary_report_due_at`). Null when no obligation is on record.",
  })
  dueAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'Earliest moment the company may submit (due date minus the 6-month window). Null when there is no due date to anchor on.',
  })
  earliestSubmissionDate!: Date | null
}
