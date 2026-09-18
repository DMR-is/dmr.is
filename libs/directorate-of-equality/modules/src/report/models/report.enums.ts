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

/**
 * How to read `report.equality_report_content`.
 *
 *   HTML  rich text — the original representation, and what every report
 *         created before the PDF path existed carries.
 *   PDF   the base64-encoded bytes the company uploaded, stored verbatim.
 *
 * The two are mutually exclusive by construction: they share the one content
 * column, so a report has one content in one representation and there is no
 * state where both are set. `equality_report_content_filename` is non-null
 * exactly when this is PDF — see the CHECK in m-20260903.
 */
export enum EqualityContentTypeEnum {
  HTML = 'HTML',
  PDF = 'PDF',
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

/**
 * What met a company's equality obligation — the discriminator on
 * `report.equality_source`, and on `EqualityReportSummaryDto.source` one route
 * earlier.
 *
 *   REPORT  an APPROVED, in-force EQUALITY report filed in this system. The
 *           salary row links it via `equality_report_id`.
 *   LEGACY  an unexpired certificate from the Directorate's retired SharePoint
 *           register (`legacy_report.equality_valid_until`). The register load
 *           mints no `report` rows from those, so there is no id to link — the
 *           salary row carries the certificate's stated expiry in
 *           `equality_legacy_valid_until` instead.
 *
 * ⚠️ LEGACY is a fact about the company's coverage at the moment of filing, not
 * a status the report can move between. Nothing rewrites it afterwards, for the
 * same reason `equality_report_id` is never rewired once set.
 */
export enum EqualityCoverageSourceEnum {
  REPORT = 'REPORT',
  LEGACY = 'LEGACY',
}
