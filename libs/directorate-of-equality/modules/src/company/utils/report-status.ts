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
 * SQL predicate: this legacy row's certificate was not surrendered.
 *
 * Normalised on both sides rather than compared exactly. `validity` is free
 * text the load copies from the sheet verbatim — `readString` trims and does
 * nothing else — so a re-export spelling the word with different casing would
 * slip past `= 'Útrunnið'`. That failure is silent and total: the load replaces
 * `legacy_report` wholesale, so the 20 surrendered certificates would quietly
 * become coverage again. `lower(btrim(…))` costs nothing here, the sub-select
 * being keyed on `company_id` with no index on `validity` to defeat.
 *
 * `IS DISTINCT FROM` keeps a NULL `validity` covered: 914 rows never had the
 * cell filled, and a blank must not withdraw coverage a date supports.
 */
const LEGACY_NOT_SURRENDERED = `lower(btrim(lr.validity)) IS DISTINCT FROM lower('${LEGACY_VALIDITY_EXPIRED}')`

/**
 * The surrender guard, applied to the salary side only. The equality plan is a
 * separate case with its own expiry, and 120 rows hold a live one beside a
 * lapsed salary certificate — reading `validity` there would mark all 120 as
 * missing a plan they hold.
 */
function legacySurrenderGuard(type: ReportTypeEnum): string {
  return type === ReportTypeEnum.SALARY ? `AND ${LEGACY_NOT_SURRENDERED}` : ''
}

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
 * ⚠️ The *salary* branch additionally rejects a surrendered certificate (see
 * `LEGACY_NOT_SURRENDERED`), because on that side the two columns describe the
 * same certificate and 20 rows have them disagreeing: it was given up early
 * ("Vottun sagt upp", "Uppsögn á skírteini") while its stated expiry still runs
 * into the future — Reykjavíkurborg's to 2027-12-15. Without the guard the date
 * alone would read those 20 as covered, and no other signal would contradict
 * it, because the load seeds `next_salary_report_due_at` from that same cell
 * and so `salaryReportOverdue` is false too. They would read SATISFACTORY.
 *
 * What the guard fixes is the *status*, and only that. Those companies are also
 * barred from filing until six months before the seeded date
 * (`evaluateSalaryRenewalEligibility`), and that lockout is neither caused nor
 * lifted here — it follows from `next_salary_report_due_at`, which the load
 * seeds from the sheet as a decision recorded in `company-register-to-sql.ts`.
 * Before this branch existed they read MISSING_EQUALITY_REPORT and were just as
 * unable to act. The guard makes the register honest about them; it does not
 * make them fixable, and whether those seeded dates should be cleared is an
 * open question for the Directorate rather than something to settle in SQL.
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
  return `EXISTS (
    SELECT 1 FROM "${DoeModels.LEGACY_REPORT}" lr
    WHERE lr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
    AND lr.${LEGACY_VALID_UNTIL_COLUMN[type]} IS NOT NULL
    AND lr.${LEGACY_VALID_UNTIL_COLUMN[type]} >= CURRENT_DATE
    ${legacySurrenderGuard(type)}
  )`
}

/**
 * Whether the company's *legacy* coverage runs out within `interval` — the
 * legacy half of the company list's "expires within" filter.
 *
 * It lives here, beside `activeLegacyCertificationExists`, because it has to
 * mirror that function's judgements or the expiry queue contradicts the status
 * column. Three gates, each matching the status `CASE`:
 *
 *   1. **The obligation.** The sheet carries a `Gildistími` for companies of
 *      every size (see the load script), so `legacy_report` holds live dates
 *      for companies below 25 that owe nothing. Without `equalityRequired` /
 *      `salaryRequired` the filter would put them in a renewal queue the status
 *      column simultaneously calls SATISFACTORY.
 *   2. **The report supersedes the certificate.** Coverage is the *union* of an
 *      APPROVED report and a live legacy certificate, so it ends at the later
 *      of the two — "one of them expires" is not "coverage expires". Once a
 *      company has filed and holds an in-force report of that type, its frozen
 *      legacy date says nothing, and reading it would flag a company covered
 *      for years to come.
 *   3. **The surrender guard**, on the salary side, exactly as in the coverage
 *      test: a certificate that was given up is not expiring soon, it is
 *      already gone, and dating it would be inventing a deadline.
 *
 * Each type is tested separately and the two OR'd, because equality and salary
 * are separate obligations with separate expiries: an equality plan lapsing in
 * ten days needs attention whatever the salary certificate says.
 *
 * ⚠️ The `report` half of the filter (in `buildCompanyExpiryWhere`) is
 * deliberately left as it was — untyped and ungated. It is self-limiting in a
 * way this half is not: a `report` row exists only because the company filed,
 * whereas a `legacy_report` row was seeded for all 1 759 of them. The one case
 * it still reads loosely is a report expiring inside the window while a legacy
 * certificate outlasts it, which needs a legacy date later than an approval's
 * `validUntil` — the reverse of how the two are dated in practice.
 *
 * `interval` is a SQL interval literal chosen by the caller from a fixed set
 * (`INTERVAL '30 days'`), never user input.
 */
export function legacyCertificationExpiringSql(interval: string): string {
  const expiring = (type: ReportTypeEnum, required: string): string => `(
    ${required}
    AND NOT ${activeReportExists(type)}
    AND EXISTS (
      SELECT 1 FROM "${DoeModels.LEGACY_REPORT}" lr
      WHERE lr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
      AND lr.${LEGACY_VALID_UNTIL_COLUMN[type]}
          BETWEEN CURRENT_DATE AND CURRENT_DATE + ${interval}
      ${legacySurrenderGuard(type)}
    )
  )`

  return `(${expiring(ReportTypeEnum.EQUALITY, equalityRequired)} OR ${expiring(
    ReportTypeEnum.SALARY,
    salaryRequired,
  )})`
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
