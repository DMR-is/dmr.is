/**
 * Physical table names, and domain constants the services share.
 *
 * Lives in the library because every model's `@Table` decorator reads from it:
 * a table name is a property of the schema, not of whichever app happens to be
 * talking to it. `CLS_NAMESPACE` stayed behind in the app — that one names a
 * transaction namespace per running process, which is app bootstrap.
 */
export enum DoeModels {
  USER = 'doe_user',
  REGION = 'region',
  POSTCODE = 'postcode',
  ISAT_SECTION = 'isat_section',
  ISAT_CATEGORY = 'isat_category',
  COMPANY = 'company',
  COMPANY_REPORT = 'company_report',
  REPORT = 'report',
  REPORT_CRITERION = 'report_criterion',
  REPORT_SUB_CRITERION = 'report_sub_criterion',
  REPORT_SUB_CRITERION_STEP = 'report_sub_criterion_step',
  REPORT_EMPLOYEE = 'report_employee',
  REPORT_EMPLOYEE_ROLE = 'report_employee_role',
  REPORT_EMPLOYEE_OUTLIER = 'report_employee_outlier',
  REPORT_OUTLIER_GROUP = 'report_outlier_group',
  REPORT_EMPLOYEE_ROLE_CRITERION_STEP = 'report_employee_role_criterion_step',
  REPORT_EMPLOYEE_PERSONAL_CRITERION_STEP = 'report_employee_personal_criterion_step',
  REPORT_RESULT = 'report_result',
  PUBLIC_REPORT = 'public_report',
  REPORT_EVENT = 'report_event',
  REPORT_COMMENT = 'report_comment',
  COMPANY_EVENT = 'company_event',
  COMPANY_COMMENT = 'company_comment',
  CONFIG = 'config',
}

/**
 * Accepted range for `report_employee.paid_hours` (greiddar stundir í
 * mánuðinum, yfirvinnustundir meðtaldar) — the denominator of reglulegt
 * tímakaup. Shared by every ingress: the Excel parser, the draft-employee
 * endpoints and the sync batch. The Excel path is not the only way in, so a
 * bound enforced only there would let the API accept what the sheet rejects.
 *
 * **Max — must match the template's own validation on column E** (`decimal
 * between 0 and 750`). A parser stricter than the sheet rejects a value Excel
 * accepted, leaving the submitter nothing to act on; looser, and it accepts
 * what the sheet refuses. 750 is ~4× a full month, which still catches the
 * likeliest data-entry error: entering the annual total (~2 080) where the
 * 12-month basis asks for a monthly average (~173).
 *
 * **Min — 4, a PLAUSIBILITY bound, not a storage one.**
 *
 * This was `0.01` and that was the wrong kind of number. `0.01` is the smallest
 * value `DECIMAL(6, 2)` can store, so it answers "what will Postgres keep?" —
 * worth knowing, because a bare `> 0` test passes `0.004`, which rounds to
 * `0.00` and then fails `CHECK (paid_hours > 0)`, turning a validation message
 * into a 500. But storability is not plausibility, and the gap between them was
 * load-bearing here.
 *
 * ⚠️ **Column E of the Launagögn sheet used to hold `Starfshlutfall (0–1)`.**
 * A value carried over from that column — by copy-paste from an older sheet, or
 * by a submitter filling in the field they remember — clears a `0.01` floor
 * untouched and inflates reglulegt tímakaup by up to ~173×. Nothing downstream
 * can catch it: it is a perfectly ordinary positive number, and because one
 * extreme denominator dominates a log-space fit, a single carried-over ratio can
 * move the company-wide compliance verdict on its own.
 *
 * 4 clears that whole range, because `starfshlutfall` cannot exceed `1`.
 * Anything above 1 closes the hole; 4 does it with margin. Note `1` — the bound
 * the Directorate's own R reference uses
 * (`in_range(greiddar_stundir, 1, 250)`) — admits `starfshlutfall = 1` exactly,
 * which is the most common value in the vacated column, so it does not close it.
 *
 * Why not higher: 4 hours is about one hour a week, and a higher floor starts
 * rejecting real rows. Someone who worked a single 8-hour shift in the reference
 * month has 8 paid hours, and if their salary figure is that shift's pay their
 * tímakaup is exactly right — a floor of 10 would reject a valid row and make
 * the employer explain a non-problem. Nor is there an error class between 4 and
 * 10 to catch: hours-per-week (~40) and days-worked (~20) both clear any floor
 * in this range.
 *
 * ⚠️ What NO floor here can catch is hours that are wrong *relative to salary* —
 * 4 hours entered against a full monthly salary is arithmetically fine and
 * wildly wrong. That needs a leverage check against the cohort (and belongs as a
 * warning, not a rejection), not a wider bound on this field.
 */
export const MIN_PAID_HOURS_PER_MONTH = 4
export const MAX_PAID_HOURS_PER_MONTH = 750

/**
 * Name assigned to the auto-created outlier group when the applicant submits a
 * salary report without explicitly grouping the detected outliers. `name` is
 * NOT NULL on `report_outlier_group`; this is the value used for the implicit
 * single-group case (the frontend may choose to hide the name when there is
 * only one default group).
 */
export const DEFAULT_OUTLIER_GROUP_NAME = 'Sjálfgefinn hópur'

/**
 * How long an approved report stays valid, and therefore how far apart a
 * company's submissions fall.
 *
 * Used here as the upper bound on `report_outlier_group.remedy_date`: a company
 * may commit to úrbætur any time between now and its next report, but a date
 * beyond that belongs to a reporting period this report cannot speak for.
 *
 * ⚠️ `ReportWorkflowService.approve` computes `validUntil` with the same three
 * years written inline. The two are the same number for the same reason and
 * should move together — this constant is where that number belongs, but
 * rewiring the workflow service was deliberately left out of the change that
 * introduced it.
 */
export const REPORT_VALIDITY_YEARS = 3
