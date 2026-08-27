import { Includeable, literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../constants'
import { PostcodeModel } from '../../location/models/postcode.model'
import { RegionModel } from '../../location/models/region.model'
import {
  CompanyReportStatusEnum,
  CompanySectorEnum,
} from '../models/company.enums'
import { IsatCategoryModel } from '../models/isat-category.model'
import {
  COMPANY_QUERY_ALIAS,
  companyReportStatusCaseSql,
  equalityReportOverdueSql,
  salaryReportOverdueSql,
} from './report-status'

/**
 * Filter the company list by compliance status. Filters on the very same
 * `CASE` expression that drives the displayed `reportStatus` column (see
 * `report-status.ts`), so the value an admin sees and the value they filter on
 * are guaranteed to match.
 */
export function buildCompanyStatusWhere(
  statuses: CompanyReportStatusEnum[],
): WhereOptions {
  if (!statuses.length) return {}
  const values = statuses.map((status) => `'${status}'`).join(', ')
  return literal(`${companyReportStatusCaseSql()} IN (${values})`)
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

export function buildCompanyExpiryWhere(
  values: CompanyExpiryFilterEnum[],
): WhereOptions {
  if (!values.length) return {}
  const interval = maxExpiryInterval(values)
  return {
    [Op.and]: [
      literal(`EXISTS (
        SELECT 1 FROM "${DoeModels.COMPANY_REPORT}" cr
        JOIN "${DoeModels.REPORT}" r ON r.id = cr.report_id
        WHERE cr.company_id = "${COMPANY_QUERY_ALIAS}"."id"
        AND r.status = 'APPROVED'
        AND r.valid_until > NOW()
        AND r.valid_until <= NOW() + ${interval}
      )`),
    ],
  }
}
