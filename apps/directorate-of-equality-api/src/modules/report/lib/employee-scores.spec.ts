import { BadRequestException } from '@nestjs/common'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
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
      expect(run).toThrow(
        /Tvítekið raðnúmer starfsmanns í innsendum gögnum: 1/,
      )
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
          new RegExp(`er með ${stepCount} þrep; leyfilegt bil er 2–8`),
        )
      },
    )

    // 0.004 is the interesting case: it passes a naive `> 0` test, then rounds
    // to 0.00 in DECIMAL(6,2) and violates the DB CHECK — a 500 where a 400
    // belongs. 800 is above the template's own cell validation.
    it.each([0, -0.25, 0.004, 800])(
      'rejects unusable paid hours of %p',
      (paidHours) => {
        const parsed = makeParsedReport()
        parsed.employees[0].paidHours = paidHours

        const run = () => assertParsedPayloadIntegrity(parsed)

        expect(run).toThrow(BadRequestException)
        expect(run).toThrow(
          /Starfsmaður með raðnúmer 1 er með ógildar greiddar stundir .* gildið verður að vera á bilinu/,
        )
      },
    )

    // The other way reglulegt tímakaup can be undefined: a real denominator
    // but nothing in the numerator. Guarded separately so the message says
    // which half is wrong.
    it('rejects an employee whose regluleg laun sum to zero', () => {
      const parsed = makeParsedReport()
      const employee = parsed.employees[0]
      employee.paidHours = 173.33
      employee.baseSalary = 0
      employee.additionalFixedOvertime = 0
      employee.additionalFixedCarAllowance = 0
      employee.bonusOccasionalCarAllowance = 0
      employee.bonusOccasionalOvertime = 0
      employee.bonusPayments = 0
      employee.bonusOther = 0

      const run = () => assertParsedPayloadIntegrity(parsed)

      expect(run).toThrow(BadRequestException)
      expect(run).toThrow(
        /Starfsmaður með raðnúmer 1 er með engin regluleg laun/,
      )
    })
  })

  describe('capacity limits', () => {
    it('rejects more than 5 criteria', () => {
      const parsed = onlyCriteria(
        Array.from({ length: 6 }, (_, i) => makeCriterion(`C${i}`, 0)),
      )

      const run = () => assertParsedPayloadIntegrity(parsed)

      expect(run).toThrow(BadRequestException)
      expect(run).toThrow(/Að hámarki 5 viðmið eru leyfð; fjöldi var 6/)
    })

    it('rejects more than 100 roles', () => {
      const parsed = makeParsedReport()
      parsed.roles = Array.from({ length: 101 }, (_, i) => ({
        title: `Role ${i}`,
        stepAssignments: [],
      }))

      const run = () => assertParsedPayloadIntegrity(parsed)

      expect(run).toThrow(BadRequestException)
      expect(run).toThrow(/Að hámarki 100 störf eru leyfð; fjöldi var 101/)
    })

    it('rejects more than 10000 employees', () => {
      const parsed = makeParsedReport()
      parsed.employees = Array.from({ length: 10001 }, (_, i) =>
        makeEmployee({ ordinal: i + 1 }),
      )

      const run = () => assertParsedPayloadIntegrity(parsed)

      expect(run).toThrow(BadRequestException)
      expect(run).toThrow(
        /Að hámarki 10000 starfsmenn eru leyfðir; fjöldi var 10001/,
      )
    })

    it('rejects more than 25 sub-criteria under a single criterion', () => {
      const parsed = onlyCriteria([makeCriterion('C', 26)])

      const run = () => assertParsedPayloadIntegrity(parsed)

      expect(run).toThrow(BadRequestException)
      expect(run).toThrow(
        /Viðmið „C“ er með 26 undirviðmið; að hámarki 25 eru leyfð á hvert viðmið/,
      )
    })

    it('allows exactly 25 sub-criteria under a criterion', () => {
      const parsed = onlyCriteria([makeCriterion('C', 25)])

      expect(() => assertParsedPayloadIntegrity(parsed)).not.toThrow()
    })

    it('rejects more than 100 personal sub-criteria', () => {
      // 5 personal criteria × 25 subs = 125 personal (total 125 stays ≤ 200).
      const parsed = onlyCriteria(
        Array.from({ length: 5 }, (_, i) =>
          makeCriterion(`P${i}`, 25, ReportCriterionTypeEnum.PERSONAL),
        ),
      )

      const run = () => assertParsedPayloadIntegrity(parsed)

      expect(run).toThrow(BadRequestException)
      expect(run).toThrow(
        /Að hámarki 100 persónubundin undirviðmið eru leyfð; fjöldi var 125/,
      )
    })
  })
})

/** A report with only criteria — no roles/employees — to isolate criteria caps. */
function onlyCriteria(
  criteria: ParsedReportDto['criteria'],
): ParsedReportDto {
  return { criteria, roles: [], employees: [] }
}

function makeCriterion(
  title: string,
  subCount: number,
  type: ReportCriterionTypeEnum = ReportCriterionTypeEnum.RESPONSIBILITY,
): ParsedReportDto['criteria'][number] {
  return {
    type,
    title,
    description: title,
    weight: 10,
    subCriteria: Array.from({ length: subCount }, (_, i) => ({
      title: `${title}-sub-${i}`,
      description: `${title}-sub-${i}`,
      weight: 1,
      steps: [
        { order: 1, description: 'low', score: 10 },
        { order: 2, description: 'high', score: 20 },
      ],
    })),
  }
}

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
    gender: GenderEnum.FEMALE,
    field: 'Management',
    department: 'Operations',
    startDate: '2021-01-01',
    paidHours: 1,
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
