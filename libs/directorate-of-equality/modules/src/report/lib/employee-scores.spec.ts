import { BadRequestException } from '@nestjs/common'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import type { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import { MAX_EMPLOYEES } from '../../report-excel/workbook.schema'
import { GenderEnum } from '../models/report.enums'
import {
  assertParsedPayloadIntegrity,
  assertParsedPayloadValid,
  computeEmployeeScores,
  stepKey,
} from './employee-scores'
import { MAX_ISSUES } from './parsed-payload-issues'

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

  describe('computeEmployeeScores', () => {
    it('counts a step once even when the role and the employee both name it', () => {
      const parsed = makeParsedReport()
      const key = stepKey('Responsibility', 'People responsibility', 1)
      parsed.employees[0].personalStepAssignments = [
        {
          criterionTitle: 'Responsibility',
          subTitle: 'People responsibility',
          stepOrder: 1,
        },
      ]

      const [score] = computeEmployeeScores(parsed, new Map([[key, 10]]))

      // 10, not 20. Defensive only: a role owns the job-based criteria and an
      // employee owns only the personal ones, so a validated payload cannot
      // produce this overlap — `assertParsedPayloadValid` refuses it. The
      // dedup stays because double-counting a step would be a wrong score
      // rather than a rejected request.
      expect(score).toBe(10)
    })
  })

  it('reports an unknown sub-criterion once, not twice', () => {
    const parsed = makeParsedReport()
    parsed.roles[0].stepAssignments = [
      {
        criterionTitle: 'Responsibility',
        subTitle: 'No such sub',
        stepOrder: 1,
      },
    ]

    let details: string[] = []
    try {
      assertParsedPayloadValid(parsed)
    } catch (e) {
      details = ((e as BadRequestException).getResponse() as {
        message: string[]
      }).message
    }

    // The pair does not exist, so the semantic rule owns the message and the
    // step-order check stays quiet: one mistake, one line. The integrity walk
    // speaks only for a bad step ORDER on a pair that is real.
    const aboutTheSub = details.filter((m) => m.includes('No such sub'))
    expect(aboutTheSub).toHaveLength(1)
    expect(aboutTheSub[0]).toMatch(/óþekkt undirviðmið/)
  })

  it('still reports a bad step order on a sub-criterion that exists', () => {
    const parsed = makeParsedReport()
    parsed.roles[0].stepAssignments = [
      {
        criterionTitle: 'Responsibility',
        subTitle: 'People responsibility',
        stepOrder: 99,
      },
    ]

    expectPayloadIssue(
      () => assertParsedPayloadValid(parsed),
      /vísar í óþekkt þrep 99 undir „Responsibility \/ People responsibility“/,
    )
  })

  describe('bounds on the accumulated list', () => {
    it('fails on the first capacity breach instead of enumerating the payload', () => {
      const parsed = makeParsedReport()
      parsed.employees = Array.from({ length: MAX_EMPLOYEES + 1 }, (_, i) =>
        makeEmployee({ ordinal: i + 1 }),
      )

      let details: string[] = []
      try {
        assertParsedPayloadValid(parsed)
      } catch (e) {
        details = ((e as BadRequestException).getResponse() as {
          message: string[]
        }).message
      }

      // One message, not one per fault. An oversized payload will never be
      // accepted, so walking it to enumerate the rest is pure cost — and the
      // completeness rules are O(employees × sub-criteria).
      expect(details).toHaveLength(1)
      expect(details[0]).toMatch(
        new RegExp(`Að hámarki ${MAX_EMPLOYEES} starfsmenn`),
      )
    })

    it('caps the list for a payload that breaches no ceiling at all', () => {
      // The accidental case, and the reason the ceilings alone are not enough:
      // every count here is legal. A vendor's first field mapping simply does
      // not populate `personalStepAssignments`, so every employee is missing an
      // assignment for every personal sub-criterion. 2 000 × 60 = 120 000
      // faults, all real, none worth sending.
      const personalSubs = 60
      const employeeCount = 2000

      const parsed = makeParsedReport()
      parsed.criteria.push({
        type: ReportCriterionTypeEnum.PERSONAL,
        title: 'Einstaklingsbundid',
        description: 'Personal',
        weight: 0,
        subCriteria: Array.from({ length: personalSubs }, (_, i) => ({
          title: `Personal sub ${i + 1}`,
          description: 'Personal sub',
          weight: 0,
          steps: [
            { order: 1, description: 'low', score: 0 },
            { order: 2, description: 'high', score: 0 },
          ],
        })),
      })
      parsed.employees = Array.from({ length: employeeCount }, (_, i) =>
        makeEmployee({ ordinal: i + 1 }),
      )

      let details: string[] = []
      try {
        assertParsedPayloadValid(parsed)
      } catch (e) {
        details = ((e as BadRequestException).getResponse() as {
          message: string[]
        }).message
      }

      expect(details.length).toBeLessThanOrEqual(MAX_ISSUES + 1)
      expect(details[details.length - 1]).toMatch(/listinn er styttur/)
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
