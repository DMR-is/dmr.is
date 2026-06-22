import { literal } from 'sequelize'

import { DoeModels } from '../../../core/constants'
import { ReportStatusEnum, ReportTypeEnum } from '../../report/models/report.enums'
import { CompanyReportStatusEnum, CompanySizeEnum } from '../models/company.enums'

/**
 * Alias under which Sequelize references the `company` table in the queries
 * that build `CompanyDto` (the model name, not the table name). Correlated
 * sub-selects below qualify the outer company row with it. Defined as a string
 * — rather than `CompanyModel.name` — so this module stays free of a model
 * import and can be consumed by the model's own scope without a cycle.
 */
export const COMPANY_QUERY_ALIAS = 'CompanyModel'

/**
 * Whether the company has a *valid* approved report of the given type. This is
 * the shared definition of "has submitted" — kept identical for the displayed
 * `reportStatus` column and the list status filter so the two never disagree.
 * "Valid" = APPROVED and not past its `valid_until`.
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
    WHEN ${equalityRequired} AND NOT ${activeReportExists(ReportTypeEnum.EQUALITY)} THEN '${CompanyReportStatusEnum.MISSING_EQUALITY_REPORT}'
    WHEN ${salaryRequired} AND NOT ${activeReportExists(ReportTypeEnum.SALARY)} THEN '${CompanyReportStatusEnum.MISSING_SALARY_REPORT}'
    WHEN ${postponedSalaryExists()} THEN '${CompanyReportStatusEnum.MISSING_ACTION_PLAN}'
    ELSE '${CompanyReportStatusEnum.SATISFACTORY}'
  END)`
}

export function companyReportStatusLiteral() {
  return literal(companyReportStatusCaseSql())
}
