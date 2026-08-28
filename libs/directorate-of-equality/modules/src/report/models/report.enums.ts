/**
 * Enums used across the report domain. Lifted out of `report.model.ts` so
 * sibling models (e.g. `report-comment.model.ts`) can import them without
 * triggering a circular import back into `report.model.ts`. The original
 * `report.model.ts` re-exports them so existing callers continue to work.
 */

export enum ReportTypeEnum {
  SALARY = 'SALARY',
  EQUALITY = 'EQUALITY',
}

export enum ReportStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  POSTPONED = 'POSTPONED',
  IN_REVIEW = 'IN_REVIEW',
  DENIED = 'DENIED',
  APPROVED = 'APPROVED',
  SUPERSEDED = 'SUPERSEDED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * Persisted state of the reviewer <-> applicant communication thread on a
 * report. Never set directly by an admin — it is a projection of what has
 * happened on the thread, moved silently as a side effect of the actions that
 * make it true.
 *
 *   NOT_STARTED       no reviewer message has been sent; the applicant cannot comment.
 *   AWAITING_RESPONSE the reviewer messaged the applicant; ball in the applicant's court.
 *   RESPONSE_RECEIVED the applicant replied (surfaces the overview "Beðið svara"
 *                     icon); ball in the reviewer's court.
 *   CLOSED            the review concluded (approve / deny / withdraw); the
 *                     thread accepts no further messages.
 *
 * AWAITING_RESPONSE / RESPONSE_RECEIVED are the "open" set — the applicant may
 * comment, and a message from either side flips the direction. NOT_STARTED /
 * CLOSED gate the applicant out. A reviewer's external comment is what opens
 * the thread (see `ReportCommentService.create`); there is no separate
 * open/close action and no audit event for these transitions.
 */
export enum CommunicationStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  RESPONSE_RECEIVED = 'RESPONSE_RECEIVED',
  CLOSED = 'CLOSED',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NEUTRAL = 'NEUTRAL',
}

/**
 * What period the salary data on a SALARY report describes — declared by the
 * submittee, not derived.
 *
 *   MONTH   the figures come from one specific payroll month. The month itself
 *           is carried in `report.salary_data_period`.
 *   AVERAGE the figures are a twelve-month average, so no single month applies
 *           and `report.salary_data_period` is null.
 *
 * Mandatory on a submitted salary report (enforced on every submit path); null
 * on equality reports, on drafts that have not declared it yet, and on reports
 * submitted before the field existed.
 */
export enum SalaryDataBasisEnum {
  MONTH = 'MONTH',
  AVERAGE = 'AVERAGE',
}

export enum ReportProviderEnum {
  SYSTEM = 'SYSTEM',
  ISLAND_IS = 'ISLAND_IS',
  OTHER = 'OTHER',
}
