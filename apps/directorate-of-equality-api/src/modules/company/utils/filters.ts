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
      // LARGE: has equality (prerequisite met) but salary not yet filed
      return {
        [Op.and]: [
          needsSalary,
          { employeeCountCategory: CompanySizeEnum.LARGE },
          literal(activeReportExists('EQUALITY')),
          literal(`NOT ${activeReportExists('SALARY')}`),
        ],
      }

    case CompanyStatusFilterEnum.HAS_EQUALITY:
      return {
        [Op.and]: [noSalaryNeeded, literal(activeReportExists('EQUALITY'))],
      }

    case CompanyStatusFilterEnum.MISSING_EQUALITY:
      return {
        [Op.or]: [
          // MEDIUM: no equality
          {
            [Op.and]: [
              noSalaryNeeded,
              { employeeCountCategory: CompanySizeEnum.MEDIUM },
              literal(`NOT ${activeReportExists('EQUALITY')}`),
            ],
          },
          // LARGE: no equality (must file equality before salary)
          {
            [Op.and]: [
              needsSalary,
              { employeeCountCategory: CompanySizeEnum.LARGE },
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
