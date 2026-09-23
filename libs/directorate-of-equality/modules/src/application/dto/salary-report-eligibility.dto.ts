import {
  ApiBoolean,
  ApiDateTime,
  ApiOptionalDateTime,
  ApiOptionalEnum,
} from '@dmr.is/decorators'

/**
 * Why a company may not file a salary report right now.
 *
 * One member, and deliberately still an enum: the reason is a wire contract the
 * island.is portal branches on, and a second precondition is likelier than a
 * first one was. `RENEWAL_WINDOW_NOT_OPEN` lived here until the 6-month renewal
 * window was removed — a company may now file whenever it likes.
 */
export enum SalaryReportEligibilityReasonEnum {
  /**
   * The company has no APPROVED, in-force equality report and no unexpired
   * certificate on the Directorate's retired register. A salary report must be
   * filed against one of the two, so the flow is blocked until it is.
   */
  MISSING_EQUALITY_REPORT = 'MISSING_EQUALITY_REPORT',
}

/**
 * Verdict for whether a company may submit a salary report right now, and what
 * doing so would cost it.
 *
 * Returned by `GET application/reports/salary/eligibility` (and its partner-API
 * twin) so the portal can gate entry into the salary flow — and, since the
 * renewal window was removed, so it can warn an applicant who is about to file
 * long before they need to.
 *
 * A report's three years run from the day it is APPROVED, not from the deadline
 * it replaces, and the two periods do not add up: filing while the current
 * certificate still has a year to run does not buy four years, it buys three
 * from now, and that unused year is simply gone. `dueAt` against the current
 * date is the size of it, and `earliestNewDueAt` is what the company gets
 * instead. Nothing prevents the trade; this is what makes it visible beforehand.
 */
export class SalaryReportEligibilityDto {
  @ApiBoolean({
    description: 'Whether the company may submit a salary report right now.',
  })
  eligible!: boolean

  @ApiOptionalEnum(SalaryReportEligibilityReasonEnum, {
    nullable: true,
    description:
      'Machine-readable reason when `eligible` is false; null when eligible. Only `MISSING_EQUALITY_REPORT` today — no approved, in-force equality report and no unexpired legacy certificate.',
  })
  reason!: SalaryReportEligibilityReasonEnum | null

  @ApiOptionalDateTime({
    nullable: true,
    // The decorator's default example is a mid-day instant, which these date
    // fields are deliberately not. Overridden so the shape the consumer sees is
    // the shape it gets.
    example: '2029-10-03T23:59:59.999Z',
    description:
      "The company's current salary-report deadline (`next_salary_report_due_at`). An end-of-day deadline — the company is not late until the named day is over. Null when no obligation is on record.",
  })
  dueAt!: Date | null

  @ApiDateTime({
    example: '2029-09-22T23:59:59.999Z',
    description:
      'The deadline a report filed now would earn, **if it were approved today** — three years on, to the end of that day. Review normally takes days or weeks and the real date moves out with it, so treat this as the earliest possible answer rather than a promise.\n\nRead against `dueAt` it is what an early filing trades: the remaining time on the current certificate is absorbed into the new three years rather than added to them. A company with a year still to run gets three years from today, not four — so a consumer that files on a schedule of its own should put `dueAt` in front of the employer first.',
  })
  earliestNewDueAt!: Date
}
