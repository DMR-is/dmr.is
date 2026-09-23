import { literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../constants'
import type { GetCompaniesQueryDto } from '../dto/get-companies-query.dto'
import { COMPANY_QUERY_ALIAS } from './report-status'

/**
 * Narrow the COMPANY list by what the company has filed.
 *
 * The register's unit is the company, and these criteria describe a report —
 * so they resolve as one correlated EXISTS rather than a join. A company comes
 * back when at least one of its filings satisfies every criterion given; the
 * row is still the company, and no company is ever returned twice however many
 * of its reports match.
 *
 * ⚠️ APPROVED filings only, and that is a deliberate narrowing rather than an
 * oversight. A draft was never sent, a denied filing was rejected and a
 * withdrawn one was taken back — none of them is something the Directorate
 * accepted, and counting them would let a company answer "has filed a
 * skýrslugjöf with a gap under 4%" on the strength of a submission that was
 * turned down. It also means report STATUS is not a criterion here: there is
 * only one status these can have.
 *
 * ⚠️ Every criterion applies to the SAME report. Asking for a skýrslugjöf
 * approved in 2026 with a 10–15% gap finds companies with one filing that is
 * all three, not companies with three filings that are each one of them.
 */

const quoteList = (values: readonly string[]): string =>
  values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ')

/** ISO day, safe to embed: built from a Date, never from caller text. */
const isoDay = (value: Date): string => value.toISOString().slice(0, 10)

/** The ISO day after `value`, for an exclusive upper bound on a timestamp. */
const nextIsoDay = (value: Date): string => {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + 1)
  return isoDay(next)
}

/**
 * A usable numeric bound, or nothing.
 *
 * ⚠️ Applied in `hasReportCriteria` as well as in the predicate, and the two
 * MUST agree. When only the predicate rejected a NaN, the clause still counted
 * as a criterion and collapsed to "has any approved filing" — silently
 * widening the result instead of refusing it, which is the worst of the three
 * possible behaviours.
 */
const finiteBound = (value: number | undefined): number | undefined =>
  value !== undefined && Number.isFinite(value) ? value : undefined

/**
 * A pay-gap bound against `report_result`, which is 1:1 with the report.
 *
 * `IS NOT NULL` is load-bearing: an equality plan has no result row at all,
 * and a salary report whose gap was not computable stores JSON null. A gap
 * that cannot be computed is not a gap of zero, so neither may satisfy a
 * lower bound of 0.
 */
const gapPredicate = (
  field: 'rawGapPercent' | 'oskyrtPercent',
  rawFrom: number | undefined,
  rawTo: number | undefined,
): string | null => {
  const from = finiteBound(rawFrom)
  const to = finiteBound(rawTo)
  if (from === undefined && to === undefined) return null

  const value = `("rr"."wage_gap_decomposition_snapshot"->>'${field}')::numeric`
  const bounds = [
    `${value} IS NOT NULL`,
    ...(from !== undefined ? [`${value} >= ${from}`] : []),
    ...(to !== undefined ? [`${value} <= ${to}`] : []),
  ]

  return (
    `EXISTS (SELECT 1 FROM "${DoeModels.REPORT_RESULT}" "rr" ` +
    `WHERE "rr"."report_id" = "r"."id" AND ${bounds.join(' AND ')})`
  )
}

/** True when the query carries any report criterion at all. */
export const hasReportCriteria = (query: GetCompaniesQueryDto): boolean =>
  Boolean(
    query.reportType?.length ||
      query.reportCompanyAdminGender?.length ||
      query.reportEqualitySource?.length ||
      query.reportSubmittedFrom ||
      query.reportSubmittedTo ||
      query.reportApprovedFrom ||
      query.reportApprovedTo ||
      query.reportValidUntilFrom ||
      query.reportValidUntilTo ||
      query.reportSalaryDataPeriodFrom ||
      query.reportSalaryDataPeriodTo ||
      finiteBound(query.reportRawGapPercentFrom) !== undefined ||
      finiteBound(query.reportRawGapPercentTo) !== undefined ||
      finiteBound(query.reportOskyrtPercentFrom) !== undefined ||
      finiteBound(query.reportOskyrtPercentTo) !== undefined ||
      query.reportHasImprovementPlan !== undefined,
  )

export const buildCompanyReportCriteriaWhere = (
  query: GetCompaniesQueryDto,
): WhereOptions | undefined => {
  if (!hasReportCriteria(query)) return undefined

  const alias = `"${COMPANY_QUERY_ALIAS}"`
  const predicates: string[] = [`"r"."status" = 'APPROVED'`]

  if (query.reportType?.length) {
    predicates.push(`"r"."type" IN (${quoteList(query.reportType)})`)
  }

  if (query.reportCompanyAdminGender?.length) {
    predicates.push(
      `"r"."company_admin_gender" IN (${quoteList(
        query.reportCompanyAdminGender,
      )})`,
    )
  }

  if (query.reportEqualitySource?.length) {
    predicates.push(
      `"r"."equality_source" IN (${quoteList(query.reportEqualitySource)})`,
    )
  }

  // `isTimestamp`: a "to" day on a timestamp column has to include that whole
  // day, so it becomes `< next day`. `salary_data_period` is DATEONLY.
  const dateRanges: Array<
    [string, Date | undefined, Date | undefined, boolean]
  > = [
    ['created_at', query.reportSubmittedFrom, query.reportSubmittedTo, true],
    ['approved_at', query.reportApprovedFrom, query.reportApprovedTo, true],
    ['valid_until', query.reportValidUntilFrom, query.reportValidUntilTo, true],
    [
      'salary_data_period',
      query.reportSalaryDataPeriodFrom,
      query.reportSalaryDataPeriodTo,
      false,
    ],
  ]

  for (const [column, from, to, isTimestamp] of dateRanges) {
    if (from) predicates.push(`"r"."${column}" >= '${isoDay(from)}'`)
    if (to) {
      predicates.push(
        isTimestamp
          ? `"r"."${column}" < '${nextIsoDay(to)}'`
          : `"r"."${column}" <= '${isoDay(to)}'`,
      )
    }
  }

  const rawGap = gapPredicate(
    'rawGapPercent',
    query.reportRawGapPercentFrom,
    query.reportRawGapPercentTo,
  )
  if (rawGap) predicates.push(rawGap)

  const oskyrtGap = gapPredicate(
    'oskyrtPercent',
    query.reportOskyrtPercentFrom,
    query.reportOskyrtPercentTo,
  )
  if (oskyrtGap) predicates.push(oskyrtGap)

  if (query.reportHasImprovementPlan !== undefined) {
    const negation = query.reportHasImprovementPlan ? '' : 'NOT '
    predicates.push(
      `${negation}EXISTS (SELECT 1 FROM "${DoeModels.REPORT_EMPLOYEE}" "re" ` +
        `INNER JOIN "${DoeModels.REPORT_EMPLOYEE_OUTLIER}" "reo" ` +
        `ON "reo"."report_employee_id" = "re"."id" ` +
        `WHERE "re"."report_id" = "r"."id")`,
    )
  }

  return {
    [Op.and]: [
      literal(
        `EXISTS (SELECT 1 FROM "${DoeModels.COMPANY_REPORT}" "cr" ` +
          `INNER JOIN "${DoeModels.REPORT}" "r" ON "r"."id" = "cr"."report_id" ` +
          `WHERE "cr"."company_id" = ${alias}."id" ` +
          `AND ${predicates.join(' AND ')})`,
      ),
    ],
  }
}
