import { literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../../core/constants'
import { CompanyReportStatusEnum } from '../models/company.enums'
import { COMPANY_QUERY_ALIAS,companyReportStatusCaseSql } from './report-status'

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
