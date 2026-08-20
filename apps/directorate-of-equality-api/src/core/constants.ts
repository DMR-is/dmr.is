export const CLS_NAMESPACE = 'directory-of-equality-api:transaction'

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
  REPORT_ROLE_RESULT = 'report_role_result',
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
 * **Min — 0.01, not "greater than 0".** The column is `DECIMAL(6, 2)`, so
 * 0.01 is the smallest storable positive value. A `> 0` test would pass
 * `0.004`, which Postgres then rounds to `0.00` and rejects against
 * `CHECK (paid_hours > 0)` — turning a validation message into a 500. The
 * template permits `0` outright, so rejecting it is the application's job.
 */
export const MIN_PAID_HOURS_PER_MONTH = 0.01
export const MAX_PAID_HOURS_PER_MONTH = 750

/**
 * Name assigned to the auto-created outlier group when the applicant submits a
 * salary report without explicitly grouping the detected outliers. `name` is
 * NOT NULL on `report_outlier_group`; this is the value used for the implicit
 * single-group case (the frontend may choose to hide the name when there is
 * only one default group).
 */
export const DEFAULT_OUTLIER_GROUP_NAME = 'Sjálfgefinn hópur'
