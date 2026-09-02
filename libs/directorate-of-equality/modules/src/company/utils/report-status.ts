import { literal } from 'sequelize'

import { DoeModels } from '../../constants'
import {
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../report/models/report.enums'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
} from '../models/company.enums'

/**
 * Alias under which Sequelize references the `company` table in the queries
 * that build `CompanyDto` (the model name, not the table name). Correlated
 * sub-selects below qualify the outer company row with it. Defined as a string
 * — rather than `CompanyModel.name` — so this module stays free of a model
 * import and can be consumed by the model's own scope without a cycle.
 */
export const COMPANY_QUERY_ALIAS = 'CompanyModel'

/**
 * Whether the company has a *valid* approved report of the given type, filed
 * through this system. "Valid" = APPROVED and not past its `valid_until`.
 */
function activeReportExists(type: ReportTypeEnum): string {
  return `EXISTS (
    SELECT 1 FROM "${DoeModels.COMPANY_REPORT}" cr
    JOIN "${DoeModels.REPORT}" r ON r.id = cr.report_id
    WHERE cr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
    AND r.type = '${type}'
    AND r.status = '${ReportStatusEnum.APPROVED}'
    AND r.valid_until > NOW()
  )`
}

/** The `legacy_report` column carrying the stated expiry for each report type. */
const LEGACY_VALID_UNTIL_COLUMN: Record<ReportTypeEnum, string> = {
  [ReportTypeEnum.EQUALITY]: 'equality_valid_until',
  [ReportTypeEnum.SALARY]: 'salary_valid_until',
}

/**
 * The sheet's own word for a certification no longer in force, held verbatim on
 * `legacy_report.validity`. Compared as a string literal because that column is
 * TEXT by design — the archive's contract is what the list said, not what our
 * domain means (see `LegacyReportModel`).
 */
const LEGACY_VALIDITY_EXPIRED = 'Útrunnið'

/**
 * Whether the company holds a certification from the Directorate's outgoing
 * SharePoint register that has not yet expired.
 *
 * The register load writes no `report` rows on purpose (see
 * `LegacyReportModel`) — a legacy certificate went through none of this
 * system's flow, so it has no employees, criteria or result to mint an APPROVED
 * report from. Without this branch, though, the two would collapse into the
 * same answer for the wrong reason: at hand-over 1 507 of 1 753 loaded
 * companies are 25+ and hold no `report` row at all, so the register read
 * MISSING_EQUALITY_REPORT for every one of them — including the ~540 whose
 * equality plan the Directorate itself records as in force. "Has not filed
 * here" is not "is out of compliance", and the admin register has to show the
 * second.
 *
 * ⚠️ The *equality* branch consults the date and nothing else — never
 * `validity` or `legacyStatus`. Those two describe the *salary* certification
 * (`Í gildi` / `Lokið` / `Útrunnið`), and the equality plan is a separate case
 * with its own number and its own expiry: 120 rows carry a live
 * `equality_valid_until` while the salary certification beside it has lapsed.
 * Reading the status columns there would wrongly mark all 120 as missing a plan
 * they hold. This is the same rule the load applies when it seeds
 * `next_equality_report_due_at` from the same cell.
 *
 * ⚠️ The *salary* branch additionally rejects `validity = 'Útrunnið'`, because
 * on that side the two columns describe the same certificate and 20 rows have
 * them disagreeing: the certificate was surrendered early ("Vottun sagt upp",
 * "Uppsögn á skírteini") while its stated expiry still runs into the future —
 * Reykjavíkurborg's to 2027-12-15. The date alone would read those as covered,
 * and nothing else would catch it: the load seeds `next_salary_report_due_at`
 * from the same cell, so `salaryReportOverdue` is false too, and the renewal
 * window (`evaluateSalaryRenewalEligibility`) bars the company from filing
 * until six months before that date. They would sit in the register as
 * SATISFACTORY, unable to correct it, until 2027.
 *
 * The guard is `IS DISTINCT FROM`, not `<>`: 914 rows have a blank `validity`
 * — the list never recorded one — and the archive keeps that as an honest NULL,
 * so a blank cell beside a live date stays covered. An `Útrunnið` row whose
 * date has actually passed already fails the date test, so this only ever moves
 * the 20.
 *
 * The comparison is `>= CURRENT_DATE`, not `> NOW()`, because these are
 * DATEONLY calendar dates: a certificate stated to be valid until today is
 * valid through today, and `> NOW()` would expire it at midnight — the same
 * reasoning that makes the load write 23:59:59 into the timestamp columns.
 */
function activeLegacyCertificationExists(type: ReportTypeEnum): string {
  const surrenderGuard =
    type === ReportTypeEnum.SALARY
      ? `AND lr.validity IS DISTINCT FROM '${LEGACY_VALIDITY_EXPIRED}'`
      : ''

  return `EXISTS (
    SELECT 1 FROM "${DoeModels.LEGACY_REPORT}" lr
    WHERE lr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
    AND lr.${LEGACY_VALID_UNTIL_COLUMN[type]} IS NOT NULL
    AND lr.${LEGACY_VALID_UNTIL_COLUMN[type]} >= CURRENT_DATE
    ${surrenderGuard}
  )`
}

/**
 * Whether the company's legacy certification runs out within `interval` — the
 * legacy half of the company list's "expires within" filter.
 *
 * It lives here, beside `activeLegacyCertificationExists`, for the reason the
 * whole module exists: coverage and expiry have to be read off the same two
 * sources or an admin gets a queue that contradicts the status column. Once a
 * legacy certificate counts as coverage, a `report`-only expiry filter hides
 * every one of those companies until the day it lapses — 1 507 of the 1 753
 * loaded at 25+ hold no `report` row at all.
 *
 * The same surrender guard applies, and for the same reason: a certificate that
 * was given up is not expiring soon, it is already gone, and advertising it as
 * "expires in 30 days" would put a date on something that ended.
 *
 * `interval` is a SQL interval literal chosen by the caller from a fixed set
 * (`INTERVAL '30 days'`), never user input.
 */
export function legacyCertificationExpiringSql(interval: string): string {
  const equalityColumn = LEGACY_VALID_UNTIL_COLUMN[ReportTypeEnum.EQUALITY]
  const salaryColumn = LEGACY_VALID_UNTIL_COLUMN[ReportTypeEnum.SALARY]

  return `EXISTS (
    SELECT 1 FROM "${DoeModels.LEGACY_REPORT}" lr
    WHERE lr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
    AND (
      lr.${equalityColumn} BETWEEN CURRENT_DATE AND CURRENT_DATE + ${interval}
      OR (
        lr.${salaryColumn} BETWEEN CURRENT_DATE AND CURRENT_DATE + ${interval}
        AND lr.validity IS DISTINCT FROM '${LEGACY_VALIDITY_EXPIRED}'
      )
    )
  )`
}

/**
 * The shared definition of "is covered" for a report type — filed here, or
 * certified under the old regime and not yet expired. Kept identical for the
 * displayed `reportStatus` column and the list status filter so the two can
 * never disagree.
 *
 * ⚠️ This is deliberately *wider* than the application portal's own gate.
 * `getSalaryReportEligibility` still demands a real `report` row, because a
 * salary report references its equality report by id (`equalityReportId`) and a
 * legacy certificate has no id to give. So a legacy-certified company reads
 * SATISFACTORY here while the portal still answers MISSING_EQUALITY_REPORT if
 * it tries to file a salary report. That divergence is intended: this column
 * answers "is this company in compliance", the portal answers "can this
 * submission be built" — and the second needs a row the first does not.
 */
function reportCovered(type: ReportTypeEnum): string {
  return `(${activeReportExists(type)} OR ${activeLegacyCertificationExists(
    type,
  )})`
}

/**
 * Whether the company has a salary report still in POSTPONED — i.e. with
 * pay-gap outliers whose explanations are deferred. This is the signal for an
 * outstanding úrbótaáætlun.
 */
function postponedSalaryExists(): string {
  return `EXISTS (
    SELECT 1 FROM "${DoeModels.COMPANY_REPORT}" cr
    JOIN "${DoeModels.REPORT}" r ON r.id = cr.report_id
    WHERE cr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
    AND r.type = '${ReportTypeEnum.SALARY}'
    AND r.status = '${ReportStatusEnum.POSTPONED}'
  )`
}

// Salary report required: the size-driven flag (LARGE) or an admin override.
const salaryRequired = `("${COMPANY_QUERY_ALIAS}"."salary_report_required" = true OR "${COMPANY_QUERY_ALIAS}"."salary_report_required_override" = true)`

// Equality report required: 25+ employees (MEDIUM|LARGE), or a salary
// obligation (which presupposes the equality plan).
const equalityRequired = `("${COMPANY_QUERY_ALIAS}"."employee_count_category" IN ('${CompanySizeEnum.MEDIUM}', '${CompanySizeEnum.LARGE}') OR ${salaryRequired})`

/**
 * The single source of truth for a company's compliance status, as a SQL
 * `CASE` yielding `CompanyReportStatusEnum` values in priority order (most
 * critical first). Used both to populate the `reportStatus` column (via the
 * model's `withReportStatus` scope) and to filter the company list, so the
 * column an admin sees and the filter they apply can never diverge.
 */
export function companyReportStatusCaseSql(): string {
  return `(CASE
    WHEN ${equalityRequired} AND NOT ${reportCovered(
    ReportTypeEnum.EQUALITY,
  )} THEN '${CompanyReportStatusEnum.MISSING_EQUALITY_REPORT}'
    WHEN ${salaryRequired} AND NOT ${reportCovered(
    ReportTypeEnum.SALARY,
  )} THEN '${CompanyReportStatusEnum.MISSING_SALARY_REPORT}'
    WHEN ${postponedSalaryExists()} THEN '${
    CompanyReportStatusEnum.MISSING_ACTION_PLAN
  }'
    ELSE '${CompanyReportStatusEnum.SATISFACTORY}'
  END)`
}

export function companyReportStatusLiteral() {
  return literal(companyReportStatusCaseSql())
}

/**
 * SQL boolean: the company's next equality-report due date exists and is in the
 * past. Surfaced on `CompanyDto.equalityReportOverdue` so admins can spot
 * companies that need attention (and possibly the daily-fines process).
 */
export function equalityReportOverdueSql(): string {
  return `("${COMPANY_QUERY_ALIAS}"."next_equality_report_due_at" IS NOT NULL AND "${COMPANY_QUERY_ALIAS}"."next_equality_report_due_at" < NOW())`
}

/** SQL boolean: the company's next salary-report due date exists and is past. */
export function salaryReportOverdueSql(): string {
  return `("${COMPANY_QUERY_ALIAS}"."next_salary_report_due_at" IS NOT NULL AND "${COMPANY_QUERY_ALIAS}"."next_salary_report_due_at" < NOW())`
}

export function equalityReportOverdueLiteral() {
  return literal(equalityReportOverdueSql())
}

export function salaryReportOverdueLiteral() {
  return literal(salaryReportOverdueSql())
}
