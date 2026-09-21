/**
 * Pure Sequelize-where builders for the admin report list. Kept out of the
 * service so they're trivial to unit-test in isolation and so the service file
 * stays focused on orchestration rather than clause shapes.
 *
 * `buildReportListWhere` at the bottom composes the rest into the one `where`
 * both readers of this filter use — the paginated list and the data export.
 */

import { literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../constants'
import { GetReportsQueryDto } from '../dto/get-reports.query.dto'
import { ReportStatusEnum } from '../models/report.enums'
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
 * This matches the PARENT company snapshot only — the `companyReport` include
 * is pinned to `parentCompanyId: null` (see the report.model scopes) so the
 * admin list doesn't multiply one report into a row per company. Listing a
 * report by one of its subsidiaries is a separate, company-scoped path (see
 * `ReportService.listForCompany`), not this free-text search.
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

/** The company dimensions a report can be narrowed by. */
export type ReportCompanyFilters = {
  employeeCountCategory?: string[]
  sector?: string[]
  isatCategoryCode?: string[]
  isatSection?: string[]
  regionCode?: string[]
  postcode?: string[]
}

/**
 * Quote a list of values as a SQL string literal list.
 *
 * Every caller passes enum members or reference-table codes that have already
 * been through `@IsEnum`/`@IsString` validation, so this is belt-and-braces —
 * but these land inside a `literal()`, which is the one place in this file
 * where a bad value would reach the statement verbatim.
 */
const quoteList = (values: readonly string[]): string =>
  values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ')

/**
 * Build a `where` clause narrowing reports by attributes of the company that
 * filed them.
 *
 * A report has no company columns of its own — it reaches the company through
 * `company_report`, which holds one row per company on a group filing. An
 * ordinary join would therefore multiply a group report into one row per
 * subsidiary, so this is a correlated EXISTS against the PARENT snapshot
 * (`parent_company_id IS NULL`), matching {@link buildImprovementPlanWhere}:
 * the outer query keeps its shape and its row count, and the `listview` scope
 * does not have to grow joins that only the export needs.
 *
 * ⚠️ Reads the company's CURRENT attributes, not the snapshot frozen on
 * `company_report`. Asking "how many reports came from sveitarfélög" is a
 * question about the register as it stands, and the snapshot deliberately
 * carries a free-text `isat_category` that is independent of the admin-owned
 * `company.isat_category_code`. Filtering the snapshot instead would answer a
 * different question with the same words.
 *
 * Returns `undefined` when no dimension is set, so callers can assign
 * conditionally without an empty clause reaching the `where`.
 */
export const buildReportCompanyWhere = (
  filters: ReportCompanyFilters,
): WhereOptions | undefined => {
  const predicates: string[] = []

  if (filters.employeeCountCategory?.length) {
    predicates.push(
      `"c"."employee_count_category" IN (${quoteList(
        filters.employeeCountCategory,
      )})`,
    )
  }

  if (filters.sector?.length) {
    predicates.push(`"c"."sector" IN (${quoteList(filters.sector)})`)
  }

  if (filters.isatCategoryCode?.length) {
    predicates.push(
      `"c"."isat_category_code" IN (${quoteList(filters.isatCategoryCode)})`,
    )
  }

  // Section is a column on the ÍSAT reference table, not on the company, so it
  // costs one more join. Kept inside the same EXISTS rather than split into a
  // second one — both narrow the same company row.
  if (filters.isatSection?.length) {
    predicates.push(
      `EXISTS (SELECT 1 FROM "${DoeModels.ISAT_CATEGORY}" "ic" ` +
        `WHERE "ic"."code" = "c"."isat_category_code" ` +
        `AND "ic"."section" IN (${quoteList(filters.isatSection)}))`,
    )
  }

  if (filters.postcode?.length) {
    predicates.push(
      `EXISTS (SELECT 1 FROM "${DoeModels.POSTCODE}" "p" ` +
        `WHERE "p"."id" = "c"."postcode_id" ` +
        `AND "p"."code" IN (${quoteList(filters.postcode)}))`,
    )
  }

  if (filters.regionCode?.length) {
    predicates.push(
      `EXISTS (SELECT 1 FROM "${DoeModels.POSTCODE}" "p" ` +
        `INNER JOIN "${DoeModels.REGION}" "r" ON "r"."id" = "p"."region_id" ` +
        `WHERE "p"."id" = "c"."postcode_id" ` +
        `AND "r"."code" IN (${quoteList(filters.regionCode)}))`,
    )
  }

  if (predicates.length === 0) return undefined

  return {
    [Op.and]: [
      literal(
        `EXISTS (SELECT 1 FROM "${DoeModels.COMPANY_REPORT}" "cr" ` +
          `INNER JOIN "${DoeModels.COMPANY}" "c" ON "c"."id" = "cr"."company_id" ` +
          `WHERE "cr"."report_id" = "${ReportModel.name}"."id" ` +
          `AND "cr"."parent_company_id" IS NULL ` +
          `AND ${predicates.join(' AND ')})`,
      ),
    ],
  }
}

/** Which figure in the decomposition snapshot a range applies to. */
export type WageGapField = 'rawGapPercent' | 'oskyrtPercent'

/**
 * Build a `where` clause narrowing reports by a pay-gap percentage.
 *
 * The figure lives inside `report_result.wage_gap_decomposition_snapshot`,
 * a JSONB column, so this is a correlated EXISTS with the value extracted and
 * cast — the same shape as the other EXISTS builders here, and it keeps the
 * `listview` scope free of a join only this filter needs.
 *
 * Three things fall OUT of the result whenever a bound is set, all correctly:
 *
 * - equality plans, which have no `report_result` at all;
 * - salary reports whose gap was not computable, where the value is JSON null.
 *   A single-gender workforce has no measurable gap, which is not a gap of 0%,
 *   so it must not answer "show me 0–0,5%";
 * - reports filed before the snapshot existed.
 *
 * `IS NOT NULL` is therefore load-bearing rather than defensive: in Postgres
 * `NULL >= 0` is NULL, not false, which is the right answer here but only
 * because the EXISTS then finds no row.
 */
export const buildWageGapRangeWhere = (
  field: WageGapField,
  from: number | undefined,
  to: number | undefined,
): WhereOptions | undefined => {
  if (from === undefined && to === undefined) return undefined

  // `field` is a union of two literals, never caller input; `from`/`to` are
  // `@IsNumber`-validated and re-checked here before they reach the statement.
  for (const bound of [from, to]) {
    if (bound !== undefined && !Number.isFinite(bound)) return undefined
  }

  const value = `("rr"."wage_gap_decomposition_snapshot"->>'${field}')::numeric`
  const bounds = [
    `${value} IS NOT NULL`,
    ...(from !== undefined ? [`${value} >= ${from}`] : []),
    ...(to !== undefined ? [`${value} <= ${to}`] : []),
  ]

  return {
    [Op.and]: [
      literal(
        `EXISTS (SELECT 1 FROM "${DoeModels.REPORT_RESULT}" "rr" ` +
          `WHERE "rr"."report_id" = "${ReportModel.name}"."id" ` +
          `AND ${bounds.join(' AND ')})`,
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
/**
 * The complete `where` for the admin report list.
 *
 * Lives here rather than on the service because TWO readers need it: the
 * paginated list and the unpaged data export. An export that resolved a filter
 * even slightly differently from the screen the admin was looking at would be
 * wrong in the worst way — plausible, and only checkable by counting rows by
 * hand.
 */
export const buildReportListWhere = (
  query: GetReportsQueryDto,
): WhereOptions => {
  const where: WhereOptions = {}

  if (query.type?.length) {
    Object.assign(where, { type: { [Op.in]: query.type } })
  }
  if (query.status?.length) {
    // Drafts belong to the applicant and are never surfaced to reviewers,
    // even when a status filter explicitly asks for them — so they are
    // filtered out of the requested set rather than honoured.
    const requested = query.status.filter(
      (status) => status !== ReportStatusEnum.DRAFT,
    )
    Object.assign(where, { status: { [Op.in]: requested } })
  } else {
    // Drafts (applicant still editing) and withdrawn reports are not surfaced
    // in admin list views by default. Withdrawn can still be requested
    // explicitly via `query.status`; drafts cannot.
    Object.assign(where, {
      status: {
        [Op.notIn]: [ReportStatusEnum.DRAFT, ReportStatusEnum.WITHDRAWN],
      },
    })
  }

  // `unassignedReviewer` deliberately overrides `reviewerUserId` — the
  // workflow question "what needs me to pick up" is the more common one.
  if (query.unassignedReviewer) {
    Object.assign(where, { reviewerUserId: { [Op.is]: null } })
  } else if (query.reviewerUserId?.length) {
    Object.assign(where, {
      reviewerUserId: { [Op.in]: query.reviewerUserId },
    })
  }

  const created = dateRangeFilter(query.createdFrom, query.createdTo)
  if (created) Object.assign(where, { createdAt: created })

  const approved = dateRangeFilter(query.approvedFrom, query.approvedTo)
  if (approved) Object.assign(where, { approvedAt: approved })

  const validUntil = dateRangeFilter(query.validUntilFrom, query.validUntilTo)
  if (validUntil) Object.assign(where, { validUntil })

  const correction = dateRangeFilter(
    query.correctionDeadlineFrom,
    query.correctionDeadlineTo,
  )
  if (correction) Object.assign(where, { correctionDeadline: correction })

  if (query.q?.trim()) {
    Object.assign(where, buildFreeTextWhere(query.q))
  }

  if (query.communicationStatus?.length) {
    Object.assign(where, {
      communicationStatus: { [Op.in]: query.communicationStatus },
    })
  }

  if (query.equalitySource?.length) {
    Object.assign(where, {
      equalitySource: { [Op.in]: query.equalitySource },
    })
  }

  if (query.companyAdminGender?.length) {
    Object.assign(where, {
      companyAdminGender: { [Op.in]: query.companyAdminGender },
    })
  }

  const salaryPeriod = dateRangeFilter(
    query.salaryDataPeriodFrom,
    query.salaryDataPeriodTo,
  )
  if (salaryPeriod) Object.assign(where, { salaryDataPeriod: salaryPeriod })

  // ⚠️ Both remaining builders key their clause on `Op.and`, so they are
  // nested under a single one rather than assigned in turn. `Object.assign`
  // overwrites a symbol key like any other, so assigning both would leave
  // only the last — and the dropped filter would fail silently: the list
  // still returns rows, just not the ones that were asked for.
  const andClauses = [
    query.hasImprovementPlan !== undefined
      ? buildImprovementPlanWhere(query.hasImprovementPlan)
      : undefined,
    buildReportCompanyWhere(query),
    buildWageGapRangeWhere(
      'rawGapPercent',
      query.rawGapPercentFrom,
      query.rawGapPercentTo,
    ),
    buildWageGapRangeWhere(
      'oskyrtPercent',
      query.oskyrtPercentFrom,
      query.oskyrtPercentTo,
    ),
  ].filter((clause): clause is WhereOptions => clause !== undefined)

  if (andClauses.length) Object.assign(where, { [Op.and]: andClauses })

  return where
}
