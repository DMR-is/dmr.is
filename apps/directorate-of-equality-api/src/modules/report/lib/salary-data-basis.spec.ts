import { BadRequestException } from '@nestjs/common'

import { SalaryDataBasisEnum } from '../models/report.enums'
import {
  normalizeSalaryDataPeriod,
  resolveDraftSalaryDataBasis,
  resolveSalaryDataBasis,
} from './salary-data-basis'

// The reporting window is relative to "now", so the clock is frozen mid-month
// to keep the literal dates below readable. With the current month at 2026-06,
// the window runs 2023-07-01 … 2026-06-01 (36 months, current one included).
const NOW = new Date('2026-06-15T12:00:00Z')

beforeAll(() => {
  jest.useFakeTimers({ now: NOW })
})

afterAll(() => {
  jest.useRealTimers()
})

describe('normalizeSalaryDataPeriod', () => {
  it('normalises any day within the month to the 1st', () => {
    expect(normalizeSalaryDataPeriod('2026-03-15')).toBe('2026-03-01')
    expect(normalizeSalaryDataPeriod('2026-05-31')).toBe('2026-05-01')
  })

  it('leaves an already-canonical value untouched', () => {
    expect(normalizeSalaryDataPeriod('2026-03-01')).toBe('2026-03-01')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeSalaryDataPeriod(' 2026-03-01 ')).toBe('2026-03-01')
  })

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(() => normalizeSalaryDataPeriod('2026-03')).toThrow(
      BadRequestException,
    )
    expect(() => normalizeSalaryDataPeriod('15.03.2026')).toThrow(
      BadRequestException,
    )
    expect(() => normalizeSalaryDataPeriod('')).toThrow(BadRequestException)
  })

  it('rejects a month outside 1-12 or a day outside 1-31', () => {
    expect(() => normalizeSalaryDataPeriod('2026-13-01')).toThrow(
      BadRequestException,
    )
    expect(() => normalizeSalaryDataPeriod('2026-03-00')).toThrow(
      BadRequestException,
    )
  })

  it('accepts the current month — the month need only have started', () => {
    expect(normalizeSalaryDataPeriod('2026-06-15')).toBe('2026-06-01')
  })

  it('rejects a month in the future', () => {
    expect(() => normalizeSalaryDataPeriod('2026-07-01')).toThrow(
      BadRequestException,
    )
    expect(() => normalizeSalaryDataPeriod('2099-01-01')).toThrow(
      BadRequestException,
    )
  })

  it('accepts the oldest month in the window but not the one before it', () => {
    expect(normalizeSalaryDataPeriod('2023-07-01')).toBe('2023-07-01')
    expect(() => normalizeSalaryDataPeriod('2023-06-30')).toThrow(
      BadRequestException,
    )
    expect(() => normalizeSalaryDataPeriod('1970-01-01')).toThrow(
      BadRequestException,
    )
  })
})

describe('resolveSalaryDataBasis (submit-time gate)', () => {
  it('requires the basis to be declared', () => {
    expect(() => resolveSalaryDataBasis({})).toThrow(BadRequestException)
    expect(() => resolveSalaryDataBasis({ salaryDataBasis: null })).toThrow(
      BadRequestException,
    )
  })

  it('requires a month when the basis is MONTH', () => {
    expect(() =>
      resolveSalaryDataBasis({ salaryDataBasis: SalaryDataBasisEnum.MONTH }),
    ).toThrow(BadRequestException)
  })

  it('keeps the month, normalised, for MONTH', () => {
    expect(
      resolveSalaryDataBasis({
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: '2026-03-20',
      }),
    ).toEqual({
      salaryDataBasis: SalaryDataBasisEnum.MONTH,
      salaryDataPeriod: '2026-03-01',
    })
  })

  it('rejects a MONTH outside the reporting window', () => {
    expect(() =>
      resolveSalaryDataBasis({
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: '2099-01-01',
      }),
    ).toThrow(BadRequestException)
  })

  it('drops any month supplied alongside AVERAGE', () => {
    expect(
      resolveSalaryDataBasis({
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
        salaryDataPeriod: '2026-03-01',
      }),
    ).toEqual({
      salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
      salaryDataPeriod: null,
    })
  })
})

describe('resolveDraftSalaryDataBasis (PATCH semantics)', () => {
  it('writes nothing when neither key is present', () => {
    expect(resolveDraftSalaryDataBasis({}, null)).toEqual({})
  })

  it('accepts a basis on its own — completeness is a submit-time concern', () => {
    expect(
      resolveDraftSalaryDataBasis(
        { salaryDataBasis: SalaryDataBasisEnum.MONTH },
        null,
      ),
    ).toEqual({ salaryDataBasis: SalaryDataBasisEnum.MONTH })
  })

  it('accepts a month on its own, normalised', () => {
    expect(
      resolveDraftSalaryDataBasis({ salaryDataPeriod: '2026-04-09' }, null),
    ).toEqual({ salaryDataPeriod: '2026-04-01' })
  })

  it('accepts a month on its own against a stored MONTH basis', () => {
    expect(
      resolveDraftSalaryDataBasis(
        { salaryDataPeriod: '2026-04-09' },
        SalaryDataBasisEnum.MONTH,
      ),
    ).toEqual({ salaryDataPeriod: '2026-04-01' })
  })

  it('clears the month when switching to AVERAGE', () => {
    expect(
      resolveDraftSalaryDataBasis(
        { salaryDataBasis: SalaryDataBasisEnum.AVERAGE },
        SalaryDataBasisEnum.MONTH,
      ),
    ).toEqual({
      salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
      salaryDataPeriod: null,
    })
  })

  it('ignores a month sent alongside AVERAGE rather than storing a stale one', () => {
    expect(
      resolveDraftSalaryDataBasis(
        {
          salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
          salaryDataPeriod: '2026-03-01',
        },
        null,
      ),
    ).toEqual({
      salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
      salaryDataPeriod: null,
    })
  })

  // The regression the CHECK constraint would otherwise turn into a 500: the
  // basis is not in the patch at all, so it has to be read off the row.
  it('ignores a month-only PATCH while the stored basis is AVERAGE', () => {
    expect(
      resolveDraftSalaryDataBasis(
        { salaryDataPeriod: '2026-03-01' },
        SalaryDataBasisEnum.AVERAGE,
      ),
    ).toEqual({ salaryDataPeriod: null })
  })

  it('clears both when the applicant undeclares the basis', () => {
    expect(
      resolveDraftSalaryDataBasis(
        { salaryDataBasis: null, salaryDataPeriod: null },
        SalaryDataBasisEnum.MONTH,
      ),
    ).toEqual({ salaryDataBasis: null, salaryDataPeriod: null })
  })

  it('takes the stored month with the basis when only the basis is undeclared', () => {
    expect(
      resolveDraftSalaryDataBasis(
        { salaryDataBasis: null },
        SalaryDataBasisEnum.MONTH,
      ),
    ).toEqual({ salaryDataBasis: null, salaryDataPeriod: null })
  })

  it('still validates the month on a draft PATCH', () => {
    expect(() =>
      resolveDraftSalaryDataBasis({ salaryDataPeriod: 'mars 2026' }, null),
    ).toThrow(BadRequestException)
    expect(() =>
      resolveDraftSalaryDataBasis({ salaryDataPeriod: '2099-01-01' }, null),
    ).toThrow(BadRequestException)
  })
})
