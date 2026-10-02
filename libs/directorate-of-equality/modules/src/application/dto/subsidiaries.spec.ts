import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { SubmitDraftDto } from '../../report-draft/submit/dto/submit-draft.dto'
import { SubmitEqualityReportDto } from './submit-equality-report.dto'
import { MAX_SUBSIDIARIES } from './submit-report-company.dto'
import { SubmitSalaryReportDto } from './submit-salary-report.dto'

/**
 * Each subsidiary costs a national registry lookup at submit, so the list is
 * bounded and each kennitala must at least be shaped like one before it gets
 * that far. Whether it belongs to a legal entity is checked in the service.
 */
type SubmitDto = new () => object

const subsidiaryErrors = (cls: SubmitDto, subsidiaries: unknown): string[] => {
  const errors = validateSync(plainToInstance(cls, { subsidiaries }))
  const own = errors.find((e) => e.property === 'subsidiaries')
  const nested = (own?.children ?? []).flatMap((child) =>
    (child.children ?? []).flatMap((c) => Object.values(c.constraints ?? {})),
  )
  return [...Object.values(own?.constraints ?? {}), ...nested]
}

/**
 * A checksum-valid kennitala, computed rather than written out so the source
 * carries no real-looking ID (`disallow-kennitalas`).
 */
const validKennitala = (first8: string): string => {
  const weights = [3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce(
    (acc, weight, index) => acc + weight * Number(first8[index]),
    0,
  )
  const check = (11 - (sum % 11)) % 11
  if (check === 10) {
    throw new Error(`no valid check digit for ${first8}`)
  }
  return `${first8}${check}0`
}

const COMPANY_ID = validKennitala('46020708')
const DASHED_COMPANY_ID = `${COMPANY_ID.slice(0, 6)}-${COMPANY_ID.slice(6)}`

const subsidiary = (nationalId: string) => ({ name: 'Acme ehf.', nationalId })

describe.each([
  ['SubmitDraftDto', SubmitDraftDto],
  ['SubmitSalaryReportDto', SubmitSalaryReportDto],
  ['SubmitEqualityReportDto', SubmitEqualityReportDto],
] as Array<[string, SubmitDto]>)('%s.subsidiaries', (_name, cls) => {
  it('accepts a list at the cap', () => {
    const list = Array.from({ length: MAX_SUBSIDIARIES }, () =>
      subsidiary(COMPANY_ID),
    )
    expect(subsidiaryErrors(cls, list)).toEqual([])
  })

  it('refuses a list over the cap', () => {
    const list = Array.from({ length: MAX_SUBSIDIARIES + 1 }, () =>
      subsidiary(COMPANY_ID),
    )
    expect(subsidiaryErrors(cls, list)).not.toEqual([])
  })

  it('normalises a dashed kennitala', () => {
    const dto = plainToInstance(cls, {
      subsidiaries: [subsidiary(DASHED_COMPANY_ID)],
    }) as { subsidiaries?: { nationalId: string }[] }

    expect(dto.subsidiaries?.[0].nationalId).toBe(COMPANY_ID)
    expect(subsidiaryErrors(cls, [subsidiary(DASHED_COMPANY_ID)])).toEqual([])
  })

  it.each(['', '12345', 'abcdefghij', '46020708801'])(
    'refuses %p as a kennitala',
    (nationalId) => {
      expect(subsidiaryErrors(cls, [subsidiary(nationalId)])).not.toEqual([])
    },
  )
})
