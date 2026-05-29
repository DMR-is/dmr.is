import { literal, Op, WhereOptions } from 'sequelize'

import { DoeModels } from '../../../core/constants'
import { CompanySizeEnum } from '../models/company.enums'
import { CompanyModel } from '../models/company.model'

export enum CompanyStatusFilterEnum {
  MISSING_EQUALITY = 'missing-equality',
  HAS_EQUALITY = 'has-equality',
  MISSING_SALARY = 'missing-salary',
  COMPLIANT = 'compliant',
}

function activeReportExists(type: 'SALARY' | 'EQUALITY'): string {
  return `EXISTS (
    SELECT 1 FROM "${DoeModels.COMPANY_REPORT}" cr
    JOIN "${DoeModels.REPORT}" r ON r.id = cr.report_id
    WHERE cr.company_id = "${CompanyModel.name}"."id"
    AND r.type = '${type}'
    AND r.status = 'APPROVED'
    AND r.valid_until > NOW()
  )`
}

const needsSalary: WhereOptions = {
  [Op.or]: [{ salaryReportRequired: true }, { salaryReportRequiredOverride: true }],
}

const noSalaryNeeded: WhereOptions = {
  salaryReportRequired: false,
  salaryReportRequiredOverride: false,
}

function statusCondition(status: CompanyStatusFilterEnum): WhereOptions {
  switch (status) {
    case CompanyStatusFilterEnum.COMPLIANT:
      return {
        [Op.or]: [
          // LARGE: salary requirement fulfilled
          {
            [Op.and]: [needsSalary, literal(activeReportExists('SALARY'))],
          },
          // MEDIUM: equality requirement fulfilled (no salary needed, not SMALL)
          {
            [Op.and]: [
              noSalaryNeeded,
              { employeeCountCategory: { [Op.ne]: CompanySizeEnum.SMALL } },
              literal(activeReportExists('EQUALITY')),
            ],
          },
          // SMALL: no requirements and nothing submitted
          {
            [Op.and]: [
              noSalaryNeeded,
              { employeeCountCategory: CompanySizeEnum.SMALL },
              literal(`NOT ${activeReportExists('EQUALITY')}`),
            ],
          },
        ],
      }

    case CompanyStatusFilterEnum.MISSING_SALARY:
      // needsSalary flag drives this — equality is prerequisite, salary not yet filed
      return {
        [Op.and]: [
          needsSalary,
          literal(activeReportExists('EQUALITY')),
          literal(`NOT ${activeReportExists('SALARY')}`),
        ],
      }

    case CompanyStatusFilterEnum.HAS_EQUALITY:
      return literal(activeReportExists('EQUALITY'))

    case CompanyStatusFilterEnum.MISSING_EQUALITY:
      return {
        [Op.or]: [
          // needsSalary flag set but equality (prerequisite) not yet filed
          {
            [Op.and]: [
              needsSalary,
              literal(`NOT ${activeReportExists('EQUALITY')}`),
            ],
          },
          // Non-SMALL, no salary obligation, no equality
          {
            [Op.and]: [
              noSalaryNeeded,
              { employeeCountCategory: { [Op.ne]: CompanySizeEnum.SMALL } },
              literal(`NOT ${activeReportExists('EQUALITY')}`),
            ],
          },
        ],
      }
  }
}

export function buildCompanyStatusWhere(
  statuses: CompanyStatusFilterEnum[],
): WhereOptions {
  if (!statuses.length) return {}
  const conditions = statuses.map(statusCondition)
  return conditions.length === 1 ? conditions[0] : { [Op.or]: conditions }
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
        WHERE cr.company_id = "${CompanyModel.name}"."id"
        AND r.status = 'APPROVED'
        AND r.valid_until > NOW()
        AND r.valid_until <= NOW() + ${interval}
      )`),
    ],
  }
}
