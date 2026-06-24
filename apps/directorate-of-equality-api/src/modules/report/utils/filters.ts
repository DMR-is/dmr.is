/**
 * Pure Sequelize-where builders used by `ReportService.list`. Kept out of
 * the service so they're trivial to unit-test in isolation and so the
 * service file stays focused on orchestration rather than clause shapes.
 */

import { literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../../core/constants'
import { ReportModel } from '../models/report.model'

/**
 * Build the `Op.or` clause for the `q` free-text search. Matches
 * case-insensitive partial strings across the fields admins actually
 * search by:
 *
 * - `report.identifier` — the `ABC-001` code admins refer to in Slack/tickets
 * - `company.name`, `company.nationalId` — looked up via the nested-include
 *   column-ref syntax `$relation.column$` so Sequelize builds the JOIN
 *
 * Person fields are intentionally excluded: contacts (`contactName`,
 * `contactEmail`) and the company admin / CEO (`companyAdminName`,
 * `companyAdminEmail`) are not matched — admins search by report or company,
 * not by the individuals on a report.
 *
 * If you add columns here, make sure the corresponding include is still
 * present in the service's `findAndCountAll` call — Sequelize needs the
 * join to exist before it can filter on it.
 */
export const buildFreeTextWhere = (term: string): WhereOptions => {
  const pattern = `%${term.trim()}%`
  return {
    [Op.or]: [
      { identifier: { [Op.iLike]: pattern } },
      { '$companyReport.name$': { [Op.iLike]: pattern } },
      { '$companyReport.national_id$': { [Op.iLike]: pattern } },
    ],
  }
}

/**
 * Build a `where` clause that filters reports by whether they have at least
 * one employee outlier — the underlying signal that drives the company-side
 * "improvement plan". Implemented as an EXISTS subquery so the main list
 * query doesn't need to join (or paginate around) the per-employee tables.
 *
 * - `true`  → only reports WITH outliers
 * - `false` → only reports WITHOUT outliers
 *
 * The outer table is referenced by its Sequelize alias (`ReportModel.name`)
 * — `findAndCountAll` / `count` both alias the main table by class name in
 * the surrounding SQL, so the subquery's correlated column resolves
 * correctly regardless of whether `subQuery` is on or off.
 */
export const buildImprovementPlanWhere = (
  hasImprovementPlan: boolean,
): WhereOptions => {
  const negation = hasImprovementPlan ? '' : 'NOT '
  return {
    [Op.and]: [
      literal(
        `${negation}EXISTS (SELECT 1 FROM "${DoeModels.REPORT_EMPLOYEE}" "re" ` +
          `INNER JOIN "${DoeModels.REPORT_EMPLOYEE_OUTLIER}" "reo" ` +
          `ON "reo"."report_employee_id" = "re"."id" ` +
          `WHERE "re"."report_id" = "${ReportModel.name}"."id")`,
      ),
    ],
  }
}

/**
 * Shape returned by {@link dateRangeFilter}. `symbol` keys carry Sequelize
 * `Op.*` tokens; the clause is spread into a `where` object under a column
 * name by the caller (e.g. `{ createdAt: dateRangeFilter(a, b) }`).
 */
export type DateRangeClause = { [key: symbol]: Date | Date[] }

/**
 * Translate a `{ from?, to? }` pair into the right Sequelize operator. Returns
 * `undefined` when neither bound is set so callers can conditionally assign
 * without a null-literal polluting the `where`.
 *
 * - both  → `Op.between`
 * - from  → `Op.gte`
 * - to    → `Op.lte`
 */
export const dateRangeFilter = (
  from: Date | undefined,
  to: Date | undefined,
): DateRangeClause | undefined => {
  if (from && to) return { [Op.between]: [from, to] }
  if (from) return { [Op.gte]: from }
  if (to) return { [Op.lte]: to }
  return undefined
}
