import { BadRequestException } from '@nestjs/common'

import { SalaryDataBasisEnum } from '../models/report.enums'
import {
  normalizeSalaryDataPeriod,
  resolveDraftSalaryDataBasis,
  resolveSalaryDataBasis,
} from './salary-data-basis'

describe('normalizeSalaryDataPeriod', () => {
  it('normalises any day within the month to the 1st', () => {
    expect(normalizeSalaryDataPeriod('2026-03-15')).toBe('2026-03-01')
    expect(normalizeSalaryDataPeriod('2026-12-31')).toBe('2026-12-01')
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

  it('rejects an out-of-range month or day', () => {
    expect(() => normalizeSalaryDataPeriod('2026-13-01')).toThrow(
      BadRequestException,
    )
    expect(() => normalizeSalaryDataPeriod('2026-03-00')).toThrow(
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
    expect(resolveDraftSalaryDataBasis({})).toEqual({})
  })

  it('accepts a basis on its own — completeness is a submit-time concern', () => {
    expect(
      resolveDraftSalaryDataBasis({
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
      }),
    ).toEqual({ salaryDataBasis: SalaryDataBasisEnum.MONTH })
  })

  it('accepts a month on its own, normalised', () => {
    expect(
      resolveDraftSalaryDataBasis({ salaryDataPeriod: '2026-07-09' }),
    ).toEqual({ salaryDataPeriod: '2026-07-01' })
  })

  it('clears the month when switching to AVERAGE', () => {
    expect(
      resolveDraftSalaryDataBasis({
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
      }),
    ).toEqual({
      salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
      salaryDataPeriod: null,
    })
  })

  it('ignores a month sent alongside AVERAGE rather than storing a stale one', () => {
    expect(
      resolveDraftSalaryDataBasis({
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
        salaryDataPeriod: '2026-03-01',
      }),
    ).toEqual({
      salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
      salaryDataPeriod: null,
    })
  })

  it('clears both when the applicant undeclares the basis', () => {
    expect(
      resolveDraftSalaryDataBasis({
        salaryDataBasis: null,
        salaryDataPeriod: null,
      }),
    ).toEqual({ salaryDataBasis: null, salaryDataPeriod: null })
  })

  it('still validates the month format on a draft PATCH', () => {
    expect(() =>
      resolveDraftSalaryDataBasis({ salaryDataPeriod: 'mars 2026' }),
    ).toThrow(BadRequestException)
  })
})
