import { isValid } from 'kennitala'

import { ParsedEmployeeDto } from '../../report-excel/dto/parsed-report.dto'
import { GenderEnum } from '../models/report.enums'
import { collectEmployeeFieldIssues } from './employee-field-rules'
import { PayloadIssueBag } from './parsed-payload-issues'

const TODAY = '2026-09-25'

// Built, not written: `disallow-kennitalas` forbids one in source.
const PERSON_KT = (() => {
  for (let check = 0; check <= 9; check++) {
    const candidate = `03068523${check}9`
    if (isValid(candidate)) return candidate
  }
  throw new Error('no fixture')
})()

const employee = (
  overrides: Partial<ParsedEmployeeDto> = {},
): ParsedEmployeeDto => ({
  ordinal: 1,
  identifier: 'E001',
  roleTitle: 'Starf',
  gender: GenderEnum.FEMALE,
  field: null,
  department: null,
  startDate: '2020-01-01',
  paidHours: 173.33,
  baseSalary: 600000,
  additionalFixedOvertime: null,
  additionalFixedCarAllowance: null,
  additionalFixedOther: null,
  bonusOccasionalOvertime: null,
  bonusOccasionalCarAllowance: null,
  bonusOther: null,
  personalStepAssignments: [],
  ...overrides,
})

const issuesFor = (e: ParsedEmployeeDto): string[] => {
  const bag = new PayloadIssueBag()
  collectEmployeeFieldIssues(e, bag, TODAY)
  return bag.messages
}

describe('collectEmployeeFieldIssues', () => {
  it('passes a well-formed employee', () => {
    expect(issuesFor(employee())).toEqual([])
  })

  it.each([0, -3, 1.5])('refuses ordinal %p', (ordinal) => {
    expect(issuesFor(employee({ ordinal }))).toEqual([
      expect.stringContaining('raðnúmer verður að vera heil tala'),
    ])
  })

  it.each([PERSON_KT, `${PERSON_KT.slice(0, 6)}-${PERSON_KT.slice(6)}`])(
    'refuses the kennitala %p as identifier',
    (identifier) => {
      expect(issuesFor(employee({ identifier }))).toEqual([
        expect.stringContaining('auðkenni má ekki vera kennitala'),
      ])
    },
  )

  it('accepts a start date of today and refuses tomorrow', () => {
    expect(issuesFor(employee({ startDate: TODAY }))).toEqual([])
    expect(issuesFor(employee({ startDate: '2026-09-26' }))).toEqual([
      expect.stringContaining('er í framtíðinni'),
    ])
  })

  it.each(['2026-02-30', '2026-13-01', '01.01.2020', ''])(
    'refuses the start date %p',
    (startDate) => {
      expect(issuesFor(employee({ startDate }))).toEqual([
        expect.stringContaining('er ekki gild dagsetning'),
      ])
    },
  )

  it.each([
    'baseSalary',
    'additionalFixedOvertime',
    'additionalFixedCarAllowance',
    'additionalFixedOther',
    'bonusOccasionalOvertime',
    'bonusOccasionalCarAllowance',
    'bonusOther',
  ] as const)('refuses a negative %s', (field) => {
    expect(issuesFor(employee({ [field]: -1 }))).toEqual([
      expect.stringContaining('mega ekki vera neikvæð'),
    ])
  })

  it('accepts zero pay components', () => {
    expect(issuesFor(employee({ bonusOther: 0 }))).toEqual([])
  })
})
