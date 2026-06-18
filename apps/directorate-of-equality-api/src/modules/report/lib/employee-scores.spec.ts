import { BadRequestException } from '@nestjs/common'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { EducationEnum } from '../../report-employee/models/report-employee.model'
import type { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import { GenderEnum } from '../models/report.enums'
import { assertParsedPayloadIntegrity } from './employee-scores'

describe('employee-scores', () => {
  describe('assertParsedPayloadIntegrity', () => {
    it('rejects duplicate employee ordinals', () => {
      const parsed = makeParsedReport()
      parsed.employees.push(
        makeEmployee({ ordinal: 1, identifier: 'TVE-001-copy' }),
      )

      const run = () => assertParsedPayloadIntegrity(parsed)

      expect(run).toThrow(BadRequestException)
      expect(run).toThrow(/Duplicate employee ordinal in parsed payload: 1/)
    })

    it.each([1, 9])(
      'rejects a sub-criterion with %p step(s) (outside the 2–8 range)',
      (stepCount) => {
        const parsed = makeParsedReport()
        parsed.criteria[0].subCriteria[0].steps = Array.from(
          { length: stepCount },
          (_, i) => ({ order: i + 1, description: `step ${i + 1}`, score: 10 }),
        )

        const run = () => assertParsedPayloadIntegrity(parsed)

        expect(run).toThrow(BadRequestException)
        expect(run).toThrow(
          new RegExp(`has ${stepCount} step\\(s\\); expected 2–8`),
        )
      },
    )

    it.each([0, -0.25])(
      'rejects a non-positive employee work ratio of %p',
      (workRatio) => {
        const parsed = makeParsedReport()
        parsed.employees[0].workRatio = workRatio

        const run = () => assertParsedPayloadIntegrity(parsed)

        expect(run).toThrow(BadRequestException)
        expect(run).toThrow(
          /Employee ordinal 1 has invalid work ratio .* expected a value greater than 0/,
        )
      },
    )
  })
})

function makeParsedReport(): ParsedReportDto {
  return {
    criteria: [
      {
        type: ReportCriterionTypeEnum.RESPONSIBILITY,
        title: 'Responsibility',
        description: 'Responsibility',
        weight: 15,
        subCriteria: [
          {
            title: 'People responsibility',
            description: 'People responsibility',
            weight: 5,
            steps: [
              { order: 1, description: 'low', score: 10 },
              { order: 2, description: 'high', score: 20 },
            ],
          },
        ],
      },
    ],
    roles: [
      {
        title: 'Manager',
        stepAssignments: [
          {
            criterionTitle: 'Responsibility',
            subTitle: 'People responsibility',
            stepOrder: 1,
          },
        ],
      },
    ],
    employees: [makeEmployee({ ordinal: 1 })],
  }
}

function makeEmployee(
  overrides: Partial<ParsedReportDto['employees'][number]> = {},
): ParsedReportDto['employees'][number] {
  const ordinal = overrides.ordinal ?? 1

  return {
    ordinal,
    identifier: `TVE-${String(ordinal).padStart(3, '0')}`,
    roleTitle: 'Manager',
    education: EducationEnum.MASTER,
    gender: GenderEnum.FEMALE,
    field: 'Management',
    department: 'Operations',
    startDate: '2021-01-01',
    workRatio: 1,
    baseSalary: 1000000,
    additionalFixedOvertime: 100000,
    additionalFixedCarAllowance: null,
    bonusOccasionalCarAllowance: null,
    bonusOccasionalOvertime: null,
    bonusPayments: null,
    bonusOther: null,
    personalStepAssignments: [],
    ...overrides,
  }
}
