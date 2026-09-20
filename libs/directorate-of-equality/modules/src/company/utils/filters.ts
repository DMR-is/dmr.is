import { Includeable, literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../constants'
import { PostcodeModel } from '../../location/models/postcode.model'
import { RegionModel } from '../../location/models/region.model'
import { ReportTypeEnum } from '../../report/models/report.enums'
// `import type`, deliberately: `get-companies-query.dto.ts` imports
// `CompanyExpiryFilterEnum` from this file at runtime, so a value import back
// would close a require cycle.
import type { GetCompaniesQueryDto } from '../dto/get-companies-query.dto'
import {
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanyStatusEnum,
} from '../models/company.enums'
import { IsatCategoryModel } from '../models/isat-category.model'
import {
  actionPlanMissingSql,
  COMPANY_QUERY_ALIAS,
  equalityReportMissingSql,
  equalityReportOverdueSql,
  hiddenFromDefaultRegisterSql,
  legacyCertificationExpiringSql,
  neverFiledAnywhereSql,
  neverFiledReportSql,
  salaryReportMissingSql,
  salaryReportOverdueSql,
} from './report-status'

/**
 * The predicate behind each selectable compliance status — the very same
 * expressions the displayed columns are built from (see `report-status.ts`), so
 * what an admin sees and what they filter on cannot diverge.
 *
 * SATISFACTORY is the absence of the other three rather than an expression of
 * its own, which is what keeps it exhaustive: a fourth obligation added later
 * lands in the roll-up and in this map, and "nothing outstanding" narrows to
 * match without anyone remembering to edit it.
 */
const STATUS_PREDICATE: Record<CompanyReportStatusEnum, () => string> = {
  [CompanyReportStatusEnum.MISSING_EQUALITY_REPORT]: equalityReportMissingSql,
  [CompanyReportStatusEnum.MISSING_ACTION_PLAN]: actionPlanMissingSql,
  [CompanyReportStatusEnum.MISSING_SALARY_REPORT]: salaryReportMissingSql,
  [CompanyReportStatusEnum.SATISFACTORY]: () =>
    `(NOT ${equalityReportMissingSql()} AND NOT ${actionPlanMissingSql()} AND NOT ${salaryReportMissingSql()})`,
}

/**
 * Filter the company list by compliance status.
 *
 * ⚠️ An OR over the per-obligation predicates, NOT a test against the roll-up
 * `reportStatus`. The list shows each missing obligation as its own column
 * value, so a company missing both reports carries both. Matching the roll-up
 * would return only the companies whose *highest-priority* problem is the one
 * selected — filtering "Vantar launagreiningu" would silently skip every
 * company that is also missing its jafnréttisáætlun, while the list visibly
 * shows them missing the launagreining.
 *
 * Selecting several statuses therefore means "missing any of these", which is
 * what a multi-select reads as.
 */
export function buildCompanyStatusWhere(
  statuses: CompanyReportStatusEnum[],
): WhereOptions {
  if (!statuses.length) return {}
  const predicates = statuses.map((status) => STATUS_PREDICATE[status]())
  return literal(`(${predicates.join(' OR ')})`)
}

/**
 * Filter the company list by register lifecycle status — whether the company is
 * in the Directorate's authoritative register (ACTIVE) or not (INACTIVE).
 *
 * A direct column, and a different axis from `buildCompanyStatusWhere` above
 * despite the neighbouring names: that one filters on compliance (what the
 * company owes), this one on whether it is on the books at all. An INACTIVE
 * company still carries a compliance status, which is why neither filter
 * implies the other.
 *
 * Nothing defaults to ACTIVE. The list has always shown both, and quietly
 * hiding INACTIVE companies the moment a filter existed would change what an
 * unfiltered page means.
 */
export function buildCompanyLifecycleStatusWhere(
  statuses: CompanyStatusEnum[],
): WhereOptions {
  return { status: { [Op.in]: statuses } }
}

/**
 * Filter to companies with an overdue report — either the equality or the
 * salary next-due date has passed. Matches the derived `equalityReportOverdue`
 * / `salaryReportOverdue` columns shown on each company.
 */
export function buildCompanyOverdueWhere(): WhereOptions {
  return literal(
    `(${equalityReportOverdueSql()} OR ${salaryReportOverdueSql()})`,
  )
}

/**
 * Filter the company list by the admin-owned ÍSAT2008 category (a direct
 * column on the company). Matches any of the given leaf codes.
 */
export function buildCompanyIsatWhere(codes: string[]): WhereOptions {
  return { isatCategoryCode: { [Op.in]: codes } }
}

/**
 * The company's ÍSAT2008 category — always joined, and narrowed to the
 * requested sections (bálkar) when the premade industry filter is active.
 *
 * The join is unconditional because `CompanyDto.isatCategory` carries the
 * resolved code and description, and the company table stores only the bare
 * `isat_category_code`. Without it the field comes back null on every read and
 * a caller has to resolve every code itself.
 *
 * ⚠️ `required` is set ONLY while filtering, and the two cases are not
 * interchangeable. A section filter must exclude companies with no
 * `isat_category_code` — an unclassified company belongs to no section and must
 * not be silently swept into one — but that same inner join applied
 * unconditionally would drop every unclassified company from the plain list.
 *
 * `isatCategory` is a `belongsTo`, so the join is 1:1 and cannot multiply rows;
 * a caller's `distinct: true` count stays correct either way.
 */
export function buildCompanyIsatCategoryInclude(
  sections?: string[],
): Includeable {
  if (!sections?.length) {
    return { model: IsatCategoryModel, as: 'isatCategory', required: false }
  }

  return {
    model: IsatCategoryModel,
    as: 'isatCategory',
    required: true,
    where: { section: { [Op.in]: sections } },
  }
}

/**
 * Filter by ownership sector (Fyrirtæki / Ráðuneyti / Ríkisaðilar /
 * Sveitarfélög). A direct column on the company, derived from the RSK legal
 * form — except RADUNEYTI, which is only ever set by hand.
 *
 * Note UNKNOWN is filterable in its own right and is never merged into a
 * classified bucket — asking for FYRIRTAEKI returns only companies we actually
 * classified as such, not everything we failed to classify.
 */
export function buildCompanySectorWhere(
  sectors: CompanySectorEnum[],
): WhereOptions {
  return { sector: { [Op.in]: sectors } }
}

/**
 * Filter by location, resolved through the company's postcode. `postcodes`
 * matches on the postcode code (póstnúmer); `regionCodes` matches on the region
 * the postcode rolls up into (landshluti). Returns an inner-join `include` that
 * selects no extra columns, so it narrows the result set without changing the
 * selected attributes. Returns `null` when neither filter is given.
 */
export function buildCompanyLocationInclude({
  postcodes,
  regionCodes,
}: {
  postcodes?: string[]
  regionCodes?: string[]
}): Includeable | null {
  const hasPostcode = !!postcodes?.length
  const hasRegion = !!regionCodes?.length
  if (!hasPostcode && !hasRegion) return null

  return {
    model: PostcodeModel,
    as: 'postcode',
    attributes: [],
    required: true,
    ...(hasPostcode ? { where: { code: { [Op.in]: postcodes } } } : {}),
    ...(hasRegion
      ? {
          include: [
            {
              model: RegionModel,
              as: 'region',
              attributes: [],
              required: true,
              where: { code: { [Op.in]: regionCodes } },
            },
          ],
        }
      : {}),
  }
}

export enum CompanyExpiryFilterEnum {
  DAYS_30 = '30d',
  MONTHS_3 = '3m',
  SOON = 'soon',
}

function maxExpiryInterval(values: CompanyExpiryFilterEnum[]): string {
  if (values.includes(CompanyExpiryFilterEnum.SOON))
    return "INTERVAL '6 months'"
  if (values.includes(CompanyExpiryFilterEnum.MONTHS_3))
    return "INTERVAL '3 months'"
  return "INTERVAL '30 days'"
}

/**
 * Filter to companies whose coverage runs out within the selected window.
 *
 * ⚠️ Both sources of coverage are checked, for the same reason
 * `companyReportStatusCaseSql` checks both: at hand-over 1 507 of the 1 753
 * loaded companies at 25+ are covered by a legacy certification and hold no
 * `report` row at all. A `report`-only filter would leave every one of them out
 * of this queue while the status column already calls them covered — so a
 * legacy certificate expiring in three weeks would surface nowhere until the
 * day it lapsed, and the first an admin heard of it would be the overdue flag.
 *
 * The legacy half is defined in `report-status.ts` beside the coverage test it
 * has to agree with; see `legacyCertificationExpiringSql`.
 */
export function buildCompanyExpiryWhere(
  values: CompanyExpiryFilterEnum[],
): WhereOptions {
  if (!values.length) return {}
  const interval = maxExpiryInterval(values)
  return {
    [Op.and]: [
      literal(`(EXISTS (
        SELECT 1 FROM "${DoeModels.COMPANY_REPORT}" cr
        JOIN "${DoeModels.REPORT}" r ON r.id = cr.report_id
        WHERE cr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
        AND r.status = 'APPROVED'
        AND r.valid_until > NOW()
        AND r.valid_until <= NOW() + ${interval}
      ) OR ${legacyCertificationExpiringSql(interval)})`),
    ],
  }
}

/**
 * Every filter on the company list, composed into one `where` plus the joins it
 * needs. Paging and sorting are the caller's — the two callers disagree.
 *
 * Exists so the list and the "send to everyone matching this filter" recipient
 * resolution cannot drift apart: a second copy of these conditions would
 * eventually answer the same question differently, in the direction of mailing
 * companies nobody selected. That includes the three default-on hides below —
 * they belong here rather than at the list's call site precisely because a
 * recipient set that ignores them mails companies the admin was never shown.
 *
 * The result must be run through the `withReportStatus` scope — `companyStatus`,
 * `overdue` and `expiresWithin` return `literal()` SQL bound to
 * `COMPANY_QUERY_ALIAS`, which does not resolve off the bare model.
 */
export function buildCompanyListQuery(
  query: GetCompaniesQueryDto,
): {
  where: WhereOptions
  includes: Includeable[]
} {
  const conditions: WhereOptions[] = []

  if (query.q) {
    const pattern = `%${query.q.trim()}%`
    conditions.push({
      [Op.or]: [
        { name: { [Op.iLike]: pattern } },
        { nationalId: { [Op.iLike]: pattern } },
      ],
    })
  }

  if (query.employeeCountCategory !== undefined) {
    conditions.push({ employeeCountCategory: query.employeeCountCategory })
  }

  if (query.companyStatus?.length) {
    conditions.push(buildCompanyStatusWhere(query.companyStatus))
  }

  if (query.status?.length) {
    conditions.push(buildCompanyLifecycleStatusWhere(query.status))
  }

  if (query.expiresWithin?.length) {
    conditions.push(buildCompanyExpiryWhere(query.expiresWithin))
  }

  if (query.finesStarted !== undefined) {
    conditions.push({ finesStarted: query.finesStarted })
  }

  if (query.quarantined !== undefined) {
    conditions.push({ quarantined: query.quarantined })
  }

  if (query.overdue) {
    conditions.push(buildCompanyOverdueWhere())
  }

  // The four "aldrei skilað" filters, AND-ed like the other flags beside them
  // in the same control: selecting both types asks for companies that have
  // filed NEITHER, which is the reading that makes a combination useful. Each
  // is unconstrained by obligation on purpose — see `neverFiledReportSql`.
  if (query.neverFiledEquality) {
    conditions.push(literal(neverFiledReportSql(ReportTypeEnum.EQUALITY)))
  }

  if (query.neverFiledSalary) {
    conditions.push(literal(neverFiledReportSql(ReportTypeEnum.SALARY)))
  }

  if (query.neverFiledEqualityIncludingLegacy) {
    conditions.push(literal(neverFiledAnywhereSql(ReportTypeEnum.EQUALITY)))
  }

  if (query.neverFiledSalaryIncludingLegacy) {
    conditions.push(literal(neverFiledAnywhereSql(ReportTypeEnum.SALARY)))
  }

  // ⚠️ Three DEFAULT-ON hides, each suppressed by an explicit request on the
  // same axis. The admin register is a working list of who owes what, and
  // roughly 250 companies that owe nothing, every deregistered company and
  // every company under an admin halt crowd it out — but a default that cannot
  // be escaped is worse than no default. `employeeCountCategory`, `status` and
  // `quarantined` are the controls for these three axes, so setting any of them
  // means the admin has already answered the question the default was guessing
  // at: filtering to Óvirkt has to return óvirk companies, not an empty page.
  //
  // Ordered after the explicit filters purely for readability; `conditions`
  // is AND-ed, so position carries no meaning.
  if (!query.includeNotObliged && query.employeeCountCategory === undefined) {
    conditions.push(literal(`NOT ${hiddenFromDefaultRegisterSql()}`))
  }

  if (!query.includeInactive && !query.status?.length) {
    conditions.push({ status: CompanyStatusEnum.ACTIVE })
  }

  // ⚠️ `quarantined` is an admin halt on all outbound activity, not a
  // compliance state, so a company under one is noise on a working list and is
  // hidden by default like the other two. The escape is `includeQuarantined`
  // (the reveal the list offers) or an explicit `quarantined`, which is still
  // accepted by the API and is the more specific answer on the same axis:
  // asking for quarantined companies has to return them, not an empty page.
  if (!query.includeQuarantined && query.quarantined === undefined) {
    conditions.push({ quarantined: false })
  }

  if (query.isatCategoryCode?.length) {
    conditions.push(buildCompanyIsatWhere(query.isatCategoryCode))
  }

  if (query.sector?.length) {
    conditions.push(buildCompanySectorWhere(query.sector))
  }

  const locationInclude = buildCompanyLocationInclude({
    postcodes: query.postcode,
    regionCodes: query.regionCode,
  })

  // Always joined — it carries the resolved ÍSAT code and description onto the
  // DTO — and additionally narrows the rows when the section filter is
  // active. See `buildCompanyIsatCategoryInclude`.
  const isatCategoryInclude = buildCompanyIsatCategoryInclude(query.isatSection)

  const includes = [locationInclude, isatCategoryInclude].filter(
    (include): include is Includeable => include !== null,
  )

  const where: WhereOptions =
    conditions.length === 0
      ? {}
      : conditions.length === 1
      ? conditions[0]
      : { [Op.and]: conditions }

  return { where, includes }
}
