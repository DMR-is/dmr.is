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
 * report. Replaces the previously derived `waitingForAction` boolean.
 *
 *   NOT_STARTED       never opened; the applicant cannot comment.
 *   OPEN              opened, no message exchanged yet; the applicant may comment.
 *   AWAITING_RESPONSE open, reviewer messaged; ball in the applicant's court.
 *   RESPONSE_RECEIVED open, the applicant has replied (surfaces the overview
 *                     "Beðið svara" icon; ball in the reviewer's court).
 *   CLOSED            reviewer closed the thread; the applicant cannot comment.
 *
 * OPEN / AWAITING_RESPONSE / RESPONSE_RECEIVED are the "open" set — the
 * applicant may comment and reviewer/applicant comments flip the direction.
 * NOT_STARTED / CLOSED gate the applicant out. Opening requires the report to
 * be IN_REVIEW; withdraw/approve/deny force CLOSED.
 */
export enum CommunicationStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  OPEN = 'OPEN',
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  RESPONSE_RECEIVED = 'RESPONSE_RECEIVED',
  CLOSED = 'CLOSED',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NEUTRAL = 'NEUTRAL',
}

export enum ReportProviderEnum {
  SYSTEM = 'SYSTEM',
  ISLAND_IS = 'ISLAND_IS',
  OTHER = 'OTHER',
}
