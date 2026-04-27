/**
 * Pure Sequelize-where builders used by `ReportService.list`. Kept out of
 * the service so they're trivial to unit-test in isolation and so the
 * service file stays focused on orchestration rather than clause shapes.
 */

import { Op, WhereOptions } from 'sequelize'

/**
 * Build the `Op.or` clause for the `q` free-text search. Matches
 * case-insensitive partial strings across the five fields admins actually
 * search by:
 *
 * - `report.identifier` — the `ABC-001` code admins refer to in Slack/tickets
 * - `report.contactName`, `report.contactEmail` — the person at the company
 * - `company.name`, `company.nationalId` — looked up via the nested-include
 *   column-ref syntax `$relation.column$` so Sequelize builds the JOIN
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
      { contactName: { [Op.iLike]: pattern } },
      { contactEmail: { [Op.iLike]: pattern } },
      { '$companyReport.name$': { [Op.iLike]: pattern } },
      { '$companyReport.national_id$': { [Op.iLike]: pattern } },
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
