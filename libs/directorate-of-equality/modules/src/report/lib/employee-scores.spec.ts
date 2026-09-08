import { BadRequestException } from '@nestjs/common'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import type { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import { GenderEnum } from '../models/report.enums'
import {
  assertParsedPayloadIntegrity,
  assertParsedPayloadValid,
} from './employee-scores'

/**
 * Payload faults now accumulate: the exception carries every message as an
 * array, which the shared HTTP filter renders as `ApiErrorDto.details`. That
 * moves the text off `error.message` — which is the generic "Bad Request
 * Exception" for an array-valued throw — so matching on the message no longer
 * works, and would silently pass against any 400 if it did.
 */
const expectPayloadIssue = (run: () => unknown, pattern: RegExp): void => {
  expect(run).toThrow(BadRequestException)

  let details: string[] = []
  try {
    run()
  } catch (e) {
    const response = (e as BadRequestException).getResponse()
    const message = (response as { message?: string | string[] }).message
    details = Array.isArray(message) ? message : [String(message)]
  }

  expect(details).toEqual(
    expect.arrayContaining([expect.stringMatching(pattern)]),
  )
}

describe('employee-scores', () => {
  describe('assertParsedPayloadIntegrity', () => {
    it('rejects duplicate employee ordinals', () => {
      const parsed = makeParsedReport()
      parsed.employees.push(
        makeEmployee({ ordinal: 1, identifier: 'TVE-001-copy' }),
      )

      const run = () => assertParsedPayloadIntegrity(parsed)

      expectPayloadIssue(
        run,
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

        expectPayloadIssue(
          run,
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

        expectPayloadIssue(
          run,
          /Starfsmaður #1: ógildar greiddar stundir .* gildið verður að vera á bilinu/,
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

      expectPayloadIssue(run, /Starfsmaður #1: engin regluleg laun/)
    })
  })

  describe('assertParsedPayloadValid', () => {
    // The gap this function exists to close. `makeParsedReport` is the fixture
    // shape every spec in the repo uses, and it is structurally sound — which
    // is exactly why the cross-field rules matter: they were reachable only
    // through the workbook parser, so a payload like this one arriving as JSON
    // was accepted whole.
    it('rejects a structurally sound payload that is not a salary report', () => {
      const parsed = makeParsedReport()

      expect(() => assertParsedPayloadIntegrity(parsed)).not.toThrow()

      expectPayloadIssue(
        () => assertParsedPayloadValid(parsed),
        /Skyldubundið starfsbundið viðmið „STRAIN“ vantar/,
      )
    })

    it('reports every fault at once rather than the first', () => {
      const parsed = makeParsedReport()

      let details: string[] = []
      try {
        assertParsedPayloadValid(parsed)
      } catch (e) {
        const message = ((e as BadRequestException).getResponse() as {
          message: string[]
        }).message
        details = message
      }

      // Three of the four mandatory types missing, and both weight totals
      // wrong — five faults, one request.
      expect(details).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/viðmið „STRAIN“ vantar/),
          expect.stringMatching(/viðmið „CONDITION“ vantar/),
          expect.stringMatching(/viðmið „COMPETENCE“ vantar/),
          expect.stringMatching(/Vægi viðmiða leggst saman í 15%/),
          expect.stringMatching(/Vægi undirviðmiða leggst saman í 5%/),
        ]),
      )
    })

    it('catches a role left unclassified on a sub-criterion', () => {
      const parsed = makeParsedReport()
      parsed.roles[0].stepAssignments = []

      // Silent today: the score just comes out lower, which moves the employee
      // along the wage-gap regression and decides whether they are flagged.
      expect(() => assertParsedPayloadIntegrity(parsed)).not.toThrow()

      expectPayloadIssue(
        () => assertParsedPayloadValid(parsed),
        /Starf „Manager“: vantar úthlutun fyrir „Responsibility \/ People responsibility“/,
      )
    })
  })

  describe('capacity limits', () => {
    it('rejects more than 5 criteria', () => {
      const parsed = onlyCriteria(
        Array.from({ length: 6 }, (_, i) => makeCriterion(`C${i}`, 0)),
      )

      const run = () => assertParsedPayloadIntegrity(parsed)

      expectPayloadIssue(run, /Að hámarki 5 viðmið eru leyfð; fjöldi var 6/)
    })

    it('rejects more than 100 roles', () => {
      const parsed = makeParsedReport()
      parsed.roles = Array.from({ length: 101 }, (_, i) => ({
        title: `Role ${i}`,
        stepAssignments: [],
      }))

      const run = () => assertParsedPayloadIntegrity(parsed)

      expectPayloadIssue(run, /Að hámarki 100 störf eru leyfð; fjöldi var 101/)
    })

    it('rejects more than 10000 employees', () => {
      const parsed = makeParsedReport()
      parsed.employees = Array.from({ length: 10001 }, (_, i) =>
        makeEmployee({ ordinal: i + 1 }),
      )

      const run = () => assertParsedPayloadIntegrity(parsed)

      expectPayloadIssue(
        run,
        /Að hámarki 10000 starfsmenn eru leyfðir; fjöldi var 10001/,
      )
    })

    it('rejects more than 25 sub-criteria under a single criterion', () => {
      const parsed = onlyCriteria([makeCriterion('C', 26)])

      const run = () => assertParsedPayloadIntegrity(parsed)

      expectPayloadIssue(
        run,
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

      expectPayloadIssue(
        run,
        /Að hámarki 100 persónubundin undirviðmið eru leyfð; fjöldi var 125/,
      )
    })
  })
})

/** A report with only criteria — no roles/employees — to isolate criteria caps. */
function onlyCriteria(criteria: ParsedReportDto['criteria']): ParsedReportDto {
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
    paidHours: 173.33,
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
