import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { AdminEqualityReportDto } from '../../admin-report/dto/admin-equality-report.dto'
import { AdminSalaryReportDto } from '../../admin-report/dto/admin-salary-report.dto'
import { CreateEqualityReportDto } from '../../report-create/dto/create-equality-report.dto'
import { CreateReportDto } from '../../report-create/dto/create-report.dto'
import { UpdateDraftDto } from '../../report-draft/draft/dto/update-draft.dto'
import { SubmitEqualityReportDto } from './submit-equality-report.dto'
import { SubmitSalaryReportDto } from './submit-salary-report.dto'

const HEADER = {
  companyAdminEmail: 'forstjori@fyrirtaeki.is',
  contactEmail: 'tengilidur@fyrirtaeki.is',
  contactPhone: '5551234',
  averageEmployeeMaleCount: 10,
  averageEmployeeFemaleCount: 9.5,
  averageEmployeeNeutralCount: 0,
}

const HEADER_FIELDS = Object.keys(HEADER)

const COUNT_FIELDS = [
  'averageEmployeeMaleCount',
  'averageEmployeeFemaleCount',
  'averageEmployeeNeutralCount',
] as const

type Dto = new () => object

// Only the header fields are judged here; the rest of each DTO is covered
// where it is defined.
const headerErrorsFor = (Dto: Dto, plain: object) =>
  validateSync(plainToInstance(Dto, plain))
    .map((e) => e.property)
    .filter((property) => HEADER_FIELDS.includes(property))

// Every channel that writes a report header refuses the same values, so a bad
// address cannot file through one path and not another.
describe.each([
  ['SubmitEqualityReportDto', SubmitEqualityReportDto],
  ['SubmitSalaryReportDto', SubmitSalaryReportDto],
  ['CreateEqualityReportDto', CreateEqualityReportDto],
  ['CreateReportDto', CreateReportDto],
  ['AdminEqualityReportDto', AdminEqualityReportDto],
  ['AdminSalaryReportDto', AdminSalaryReportDto],
  ['UpdateDraftDto', UpdateDraftDto],
] as const)('%s header', (_name, Dto) => {
  it('accepts a complete header, fractional averages included', () => {
    expect(headerErrorsFor(Dto, HEADER)).toEqual([])
  })

  it.each(['companyAdminEmail', 'contactEmail'])(
    'refuses %s that is not an address',
    (field) => {
      expect(
        headerErrorsFor(Dto, { ...HEADER, [field]: 'notanemail' }),
      ).toEqual([field])
    },
  )

  it.each(COUNT_FIELDS)('refuses a negative %s', (field) => {
    expect(headerErrorsFor(Dto, { ...HEADER, [field]: -5 })).toEqual([field])
  })

  it('stores the addresses trimmed', () => {
    const dto = plainToInstance<object, object>(Dto, {
      ...HEADER,
      contactEmail: '  tengilidur@fyrirtaeki.is ',
    }) as { contactEmail: string }

    expect(dto.contactEmail).toBe('tengilidur@fyrirtaeki.is')
  })
})

describe.each([
  ['SubmitEqualityReportDto', SubmitEqualityReportDto],
  ['SubmitSalaryReportDto', SubmitSalaryReportDto],
  ['CreateEqualityReportDto', CreateEqualityReportDto],
  ['CreateReportDto', CreateReportDto],
  ['AdminEqualityReportDto', AdminEqualityReportDto],
  ['AdminSalaryReportDto', AdminSalaryReportDto],
] as const)('%s filing', (_name, Dto) => {
  it.each(['', '   '])('refuses contactPhone %j', (contactPhone) => {
    expect(headerErrorsFor(Dto, { ...HEADER, contactPhone })).toEqual([
      'contactPhone',
    ])
  })
})

describe('UpdateDraftDto', () => {
  it.each([null, ''])('lets a draft hold a blank address (%j)', (value) => {
    expect(
      headerErrorsFor(UpdateDraftDto, {
        companyAdminEmail: value,
        contactEmail: value,
      }),
    ).toEqual([])
  })
})
