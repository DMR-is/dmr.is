import {
  CompanySectorEnum,
  CompanySizeEnum,
} from '../../company/models/company.enums'
import {
  StatisticsCertificationStatusEnum as Status,
  StatisticsSectorEnum,
} from '../dto/aggregate-statistics.dto'
import {
  certificationStatus,
  companyCells,
  CompanyStatisticsRow,
  employeesByStatus,
  MINIMUM_COHORT,
  nextUtcMidnight,
  parseRound,
  roundCells,
  toStatisticsSector,
  validityRound,
} from './aggregate'

const row = (
  overrides: Partial<CompanyStatisticsRow> = {},
): CompanyStatisticsRow => ({
  region: 'Höfuðborgarsvæðið',
  size: CompanySizeEnum.LARGE,
  sector: CompanySectorEnum.FYRIRTAEKI,
  salaryReportActive: false,
  legacySalaryInForce: false,
  legacyCertificationType: null,
  legacyRound: null,
  approvedSalaryReports: 0,
  reportHeadcount: null,
  legacyHeadcount: null,
  ...overrides,
})

const vottun = (overrides: Partial<CompanyStatisticsRow> = {}) =>
  row({
    legacySalaryInForce: true,
    legacyCertificationType: 'Vottun',
    ...overrides,
  })

describe('certificationStatus', () => {
  it('reads the legacy certificate type, ignoring case and whitespace', () => {
    expect(certificationStatus(vottun())).toBe(Status.VOTTUN)
    expect(
      certificationStatus(vottun({ legacyCertificationType: ' STAÐFESTING ' })),
    ).toBe(Status.STADFESTING)
  })

  it('marks an in-force certificate with no recorded type as unclassified', () => {
    expect(certificationStatus(vottun({ legacyCertificationType: null }))).toBe(
      Status.UNCLASSIFIED,
    )
    expect(
      certificationStatus(vottun({ legacyCertificationType: 'eitthvað' })),
    ).toBe(Status.UNCLASSIFIED)
  })

  it('lets an approved report filed here take precedence over a legacy certificate', () => {
    expect(certificationStatus(vottun({ salaryReportActive: true }))).toBe(
      Status.SKYRSLUGJOF,
    )
  })

  it('ignores the type of a certificate that is not in force', () => {
    expect(
      certificationStatus(row({ legacyCertificationType: 'Vottun' })),
    ).toBe(Status.NONE)
  })
})

describe('parseRound', () => {
  it.each([
    ['1.', 1],
    [' 4. ', 4],
    ['2', 2],
  ])('reads %p as %p', (input, expected) => {
    expect(parseRound(input)).toBe(expected)
  })

  it.each([null, '', 'fyrsta', '0.', '1.5'])('rejects %p', (input) => {
    expect(parseRound(input)).toBeNull()
  })
})

describe('validityRound', () => {
  it('adds one round per approved skýrslugjöf to the legacy round', () => {
    expect(validityRound({ legacyRound: '2.', approvedSalaryReports: 1 })).toBe(
      3,
    )
  })

  it('counts approved reports alone when the legacy register has no round', () => {
    expect(validityRound({ legacyRound: null, approvedSalaryReports: 2 })).toBe(
      2,
    )
  })

  it('is null when neither source has a round', () => {
    expect(
      validityRound({ legacyRound: null, approvedSalaryReports: 0 }),
    ).toBeNull()
  })
})

describe('toStatisticsSector', () => {
  it('folds ráðuneyti into ríkisaðilar', () => {
    expect(toStatisticsSector(CompanySectorEnum.RADUNEYTI)).toBe(
      StatisticsSectorEnum.RIKISADILI,
    )
  })

  it('keeps unknown separate', () => {
    expect(toStatisticsSector(CompanySectorEnum.UNKNOWN)).toBe(
      StatisticsSectorEnum.UNKNOWN,
    )
  })
})

describe('companyCells', () => {
  it('counts every company once, in the cell of its dimensions and status', () => {
    const cells = companyCells([
      vottun(),
      vottun(),
      row(),
      vottun({ size: CompanySizeEnum.MEDIUM }),
    ])

    expect(cells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          size: CompanySizeEnum.LARGE,
          status: Status.VOTTUN,
          companies: 2,
        }),
        expect.objectContaining({
          size: CompanySizeEnum.LARGE,
          status: Status.NONE,
          companies: 1,
        }),
        expect.objectContaining({
          size: CompanySizeEnum.MEDIUM,
          status: Status.VOTTUN,
          companies: 1,
        }),
      ]),
    )
    expect(cells.reduce((sum, cell) => sum + cell.companies, 0)).toBe(4)
  })

  it('merges ráðuneyti and ríkisaðilar into one cell', () => {
    const cells = companyCells([
      row({ sector: CompanySectorEnum.RADUNEYTI }),
      row({ sector: CompanySectorEnum.RIKISADILI }),
    ])

    expect(cells).toHaveLength(1)
    expect(cells[0]).toMatchObject({
      sector: StatisticsSectorEnum.RIKISADILI,
      companies: 2,
    })
  })

  it('lets a filter be answered by summing cells', () => {
    const rows = [
      vottun({ region: 'Vesturland' }),
      vottun({ region: 'Austurland' }),
      row({ region: 'Vesturland', size: CompanySizeEnum.SMALL }),
    ]
    const vesturland = companyCells(rows)
      .filter((cell) => cell.region === 'Vesturland')
      .reduce((sum, cell) => sum + cell.companies, 0)

    expect(vesturland).toBe(
      rows.filter((company) => company.region === 'Vesturland').length,
    )
  })

  it('carries no company-identifying field', () => {
    const [cell] = companyCells([vottun({ legacyHeadcount: 120 })])

    expect(Object.keys(cell).sort()).toEqual(
      ['companies', 'region', 'sector', 'size', 'status'].sort(),
    )
  })
})

describe('roundCells', () => {
  it('counts only companies with something in force, without their status', () => {
    const cells = roundCells([
      vottun({ legacyRound: '2.' }),
      row({ legacyRound: '3.' }),
      row({ salaryReportActive: true, approvedSalaryReports: 1 }),
      vottun({ legacyRound: null }),
    ])

    expect(cells).toHaveLength(3)
    expect(cells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ round: 2, companies: 1 }),
        expect.objectContaining({ round: 1, companies: 1 }),
        expect.objectContaining({ round: null, companies: 1 }),
      ]),
    )
    expect(cells.every((cell) => !('status' in cell))).toBe(true)
  })
})

describe('employeesByStatus', () => {
  const cohort = (count: number, overrides: Partial<CompanyStatisticsRow>) =>
    Array.from({ length: count }, () => vottun(overrides))

  it('sums headcounts once the cohort floor is met', () => {
    const [entry] = employeesByStatus(
      cohort(MINIMUM_COHORT, { legacyHeadcount: 10 }),
    ).filter((e) => e.status === Status.VOTTUN)

    expect(entry.employees).toBe(MINIMUM_COHORT * 10)
  })

  it('withholds a sum over fewer companies than the floor, rather than publishing it', () => {
    const [entry] = employeesByStatus(
      cohort(MINIMUM_COHORT - 1, { legacyHeadcount: 10 }),
    ).filter((e) => e.status === Status.VOTTUN)

    expect(entry.employees).toBeNull()
  })

  it('counts only companies that stated a headcount toward the floor', () => {
    const rows = [
      ...cohort(MINIMUM_COHORT - 1, { legacyHeadcount: 10 }),
      ...cohort(3, { legacyHeadcount: null }),
    ]
    const [entry] = employeesByStatus(rows).filter(
      (e) => e.status === Status.VOTTUN,
    )

    expect(entry.employees).toBeNull()
  })

  it('uses the report headcount for companies covered by a report filed here', () => {
    const rows = cohort(MINIMUM_COHORT, {
      salaryReportActive: true,
      reportHeadcount: 7,
      legacyHeadcount: 1000,
    })
    const [entry] = employeesByStatus(rows).filter(
      (e) => e.status === Status.SKYRSLUGJOF,
    )

    expect(entry.employees).toBe(MINIMUM_COHORT * 7)
  })

  it('publishes no headcount for companies with nothing in force', () => {
    const statuses = employeesByStatus([row({ legacyHeadcount: 50 })]).map(
      (e) => e.status,
    )

    expect(statuses).not.toContain(Status.NONE)
  })
})

describe('nextUtcMidnight', () => {
  it('returns the start of the next UTC day', () => {
    expect(nextUtcMidnight(new Date('2026-09-25T13:45:00Z'))).toEqual(
      new Date('2026-09-26T00:00:00Z'),
    )
  })

  it('moves a full day forward from exactly midnight', () => {
    expect(nextUtcMidnight(new Date('2026-12-31T00:00:00Z'))).toEqual(
      new Date('2027-01-01T00:00:00Z'),
    )
  })
})
