import { Includeable, literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../constants'
import { PostcodeModel } from '../../location/models/postcode.model'
import { RegionModel } from '../../location/models/region.model'
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
  legacyCertificationExpiringSql,
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
  return literal(`(${equalityReportOverdueSql()} OR ${salaryReportOverdueSql()})`)
}

/**
 * Filter the company list by the admin-owned ÍSAT2008 category (a direct
 * column on the company). Matches any of the given leaf codes.
 */
export function buildCompanyIsatWhere(codes: string[]): WhereOptions {
  return { isatCategoryCode: { [Op.in]: codes } }
}

/**
 * Filter by ÍSAT2008 section (bálkur) — the premade industry filter, e.g.
 * section `O` for public administration instead of enumerating every leaf under
 * division 84. Resolved through the company's ÍSAT category, mirroring the
 * postcode → region join: an inner-join `include` selecting no extra columns, so
 * it narrows the result set without changing the selected attributes.
 *
 * Because the join is `required`, companies with no `isat_category_code` are
 * excluded — correct, since an unclassified company belongs to no section and
 * must not be silently swept into one.
 *
 * Returns null when no sections were requested.
 */
export function buildCompanyIsatSectionInclude(
  sections?: string[],
): Includeable | null {
  if (!sections?.length) return null

  return {
    model: IsatCategoryModel,
    as: 'isatCategory',
    attributes: [],
    required: true,
    where: { section: { [Op.in]: sections } },
  }
}

/**
 * Filter by ownership sector (private vs government/state). A direct column on
 * the company, derived from the RSK legal form.
 *
 * Note UNKNOWN is filterable in its own right and is never merged into PRIVATE —
 * asking for PRIVATE returns only companies we actually classified as private.
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
  if (values.includes(CompanyExpiryFilterEnum.SOON)) return "INTERVAL '6 months'"
  if (values.includes(CompanyExpiryFilterEnum.MONTHS_3)) return "INTERVAL '3 months'"
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
