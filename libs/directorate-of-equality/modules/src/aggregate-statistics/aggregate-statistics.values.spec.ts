import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CompanySectorEnum,
  CompanySizeEnum,
} from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { RegionModel } from '../location/models/region.model'
import { WageGapDirectionEnum } from '../report/lib/wage-gap-decomposition'
import { GenderEnum, ReportTypeEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { AggregateStatisticsDto } from './dto/aggregate-statistics.dto'
import { AggregateStatisticsService } from './aggregate-statistics.service'

/**
 * What the figures COUNT, as opposed to how their axes line up (see
 * `aggregate-statistics.alignment.spec.ts`).
 *
 * Coverage itself is decided in SQL by the register's `reportCovered`, so the
 * company rows here carry the flag that query would return. What is asserted is
 * that the service reads that flag — and not a scan of report rows, which is
 * what once left legacy-certified companies and group subsidiaries uncounted.
 */

type CompanyFixture = {
  id: string
  size: CompanySizeEnum
  equalityCovered?: boolean
  salaryCovered?: boolean
  sector?: CompanySectorEnum
  region?: string
}

type ReportFixture = {
  id: string
  type: ReportTypeEnum
  /** The first is the filer; the rest are group subsidiaries. */
  companyIds: string[]
  adminGender?: GenderEnum | null
  approvedAt?: Date
  rawGapPercent?: number | null
  rawGapDirection?: WageGapDirectionEnum | null
}

const approvedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

const run = async (
  companies: CompanyFixture[],
  reports: ReportFixture[] = [],
  regions: string[] = [],
) => {
  const companyFindAll = jest.fn().mockResolvedValue(
    companies.map((company) => ({
      id: company.id,
      sector: company.sector ?? CompanySectorEnum.FYRIRTAEKI,
      employeeCountCategory: company.size,
      equalityCovered: company.equalityCovered ?? false,
      salaryCovered: company.salaryCovered ?? false,
      postcode: company.region ? { region: { name: company.region } } : null,
    })),
  )

  // Two reads hit the report table: the approved filings (which select `id`)
  // and the headcount sum (which does not).
  const reportFindAll = jest.fn().mockImplementation((options) =>
    Promise.resolve(
      Array.isArray(options?.attributes) && options.attributes.includes('id')
        ? reports.map((report) => ({
            id: report.id,
            type: report.type,
            approvedAt: report.approvedAt ?? approvedAt,
            validUntil,
            companyAdminGender: report.adminGender ?? null,
            rawGapPercent: report.rawGapPercent ?? null,
            rawGapDirection: report.rawGapDirection ?? null,
            oskyrtPercent: null,
            oskyrtDirection: null,
          }))
        : [{ total: null }],
    ),
  )

  const module = await Test.createTestingModule({
    providers: [
      AggregateStatisticsService,
      { provide: LOGGER_PROVIDER, useValue: { info: jest.fn() } },
      {
        provide: getModelToken(CompanyModel),
        useValue: { findAll: companyFindAll },
      },
      {
        provide: getModelToken(ReportModel),
        useValue: { findAll: reportFindAll },
      },
      {
        provide: getModelToken(CompanyReportModel),
        useValue: {
          findAll: jest.fn().mockResolvedValue(
            reports.flatMap((report) =>
              report.companyIds.map((companyId, i) => ({
                reportId: report.id,
                companyId,
                parentCompanyId: i === 0 ? null : report.companyIds[0],
              })),
            ),
          ),
        },
      },
      {
        provide: getModelToken(RegionModel),
        useValue: {
          findAll: jest
            .fn()
            .mockResolvedValue(regions.map((name) => ({ name }))),
        },
      },
    ],
  }).compile()

  const statistics = await module
    .get<AggregateStatisticsService>(AggregateStatisticsService)
    .getStatistics()

  return { statistics, companyFindAll }
}

const pointsOf = (statistics: AggregateStatisticsDto, key: string) => {
  const found = statistics.series.find((s) => s.key === key)
  if (!found) throw new Error(`no series "${key}"`)
  return found.points
}

const valueOf = (statistics: AggregateStatisticsDto, key: string) =>
  pointsOf(statistics, key)[0]?.value

const lastValueOf = (statistics: AggregateStatisticsDto, key: string) => {
  const points = pointsOf(statistics, key)
  return points[points.length - 1]?.value
}

describe('aggregate statistics — current coverage', () => {
  it('reads coverage with the register predicate, legacy and subsidiaries included', async () => {
    const { companyFindAll } = await run([])

    const sql = JSON.stringify(companyFindAll.mock.calls[0][0].attributes)

    // `reportCovered`: a live legacy certificate counts, and the report join is
    // on `company_id` alone, so a subsidiary of a group report counts too.
    expect(sql).toContain('legacy_report')
    expect(sql).toContain('cr.company_id')
    expect(sql).not.toContain('parent_company_id')
  })

  it('counts every covered obliged company as complied, whatever covers it', async () => {
    // Stand-ins for: an own report, a legacy certificate, a group subsidiary —
    // all three read `covered` from `reportCovered` — and one with nothing.
    const { statistics } = await run([
      { id: 'own', size: CompanySizeEnum.LARGE, equalityCovered: true },
      { id: 'legacy', size: CompanySizeEnum.MEDIUM, equalityCovered: true },
      { id: 'subsidiary', size: CompanySizeEnum.MEDIUM, equalityCovered: true },
      { id: 'none', size: CompanySizeEnum.LARGE },
    ])

    expect(valueOf(statistics, 'equality.obliged')).toBe(4)
    expect(valueOf(statistics, 'equality.complied')).toBe(3)
    expect(valueOf(statistics, 'equality.percent')).toBe(0.75)
    expect(pointsOf(statistics, 'equalityBySize.complied')).toEqual([
      { header: '25–49', value: 2 },
      { header: '50+', value: 1 },
    ])
  })

  it('counts a covered company outside the obligation as voluntary, not complied', async () => {
    const { statistics } = await run([
      { id: 'small', size: CompanySizeEnum.SMALL, equalityCovered: true },
      { id: 'large', size: CompanySizeEnum.LARGE },
    ])

    expect(valueOf(statistics, 'equality.complied')).toBe(0)
    expect(valueOf(statistics, 'equality.voluntary')).toBe(1)
  })
})

describe('aggregate statistics — filed reports', () => {
  it('counts every company a group report covers, and the report once', async () => {
    const { statistics } = await run(
      [
        { id: 'parent', size: CompanySizeEnum.LARGE },
        { id: 'subsidiary', size: CompanySizeEnum.MEDIUM },
      ],
      [
        {
          id: 'group',
          type: ReportTypeEnum.EQUALITY,
          companyIds: ['parent', 'subsidiary'],
        },
      ],
    )

    expect(lastValueOf(statistics, 'equality.compliedOverTime')).toBe(2)
    expect(
      pointsOf(statistics, 'equality.approvals').reduce(
        (sum, p) => sum + (p.value ?? 0),
        0,
      ),
    ).toBe(1)
  })

  const salaryReport = (
    id: string,
    rawGapPercent: number,
    rawGapDirection: WageGapDirectionEnum | null,
  ): ReportFixture => ({
    id,
    type: ReportTypeEnum.SALARY,
    companyIds: [id],
    rawGapPercent,
    rawGapDirection,
  })

  it('lets pay gaps in opposite directions cancel', async () => {
    const { statistics } = await run(
      [],
      [
        salaryReport('a', 4, WageGapDirectionEnum.FEMALE),
        salaryReport('b', 4, WageGapDirectionEnum.FEMALE),
        salaryReport('c', 4, WageGapDirectionEnum.FEMALE),
        salaryReport('d', 4, WageGapDirectionEnum.MALE),
        salaryReport('e', 4, WageGapDirectionEnum.MALE),
      ],
    )

    // (3 × 4 − 2 × 4) / 5 = 0.8 percent points, published as a fraction.
    expect(valueOf(statistics, 'payGap.raw')).toBe(0.008)
  })

  it('leaves out a gap with no direction rather than guessing its sign', async () => {
    const { statistics } = await run(
      [],
      [
        salaryReport('a', 4, WageGapDirectionEnum.FEMALE),
        salaryReport('b', 4, WageGapDirectionEnum.FEMALE),
        salaryReport('c', 4, WageGapDirectionEnum.FEMALE),
        salaryReport('d', 4, WageGapDirectionEnum.FEMALE),
        salaryReport('e', 4, null),
      ],
    )

    // Four signed values is below the cohort of five, so nothing is published.
    expect(valueOf(statistics, 'payGap.raw')).toBeNull()
  })
})

describe('aggregate statistics — æðsti stjórnandi', () => {
  const report = (
    id: string,
    adminGender: GenderEnum | null,
    companyIds: string[] = [id],
  ): ReportFixture => ({
    id,
    type: ReportTypeEnum.EQUALITY,
    companyIds,
    adminGender,
  })

  const company = (
    id: string,
    extra: Partial<CompanyFixture> = {},
  ): CompanyFixture => ({ id, size: CompanySizeEnum.LARGE, ...extra })

  it('counts the filer of a group report once, not each subsidiary', async () => {
    // The admin on a group report is the parent's chief. Counting it per
    // subsidiary would multiply one person by the size of the group.
    const { statistics } = await run(
      [company('parent'), company('sub1'), company('sub2')],
      [report('group', GenderEnum.FEMALE, ['parent', 'sub1', 'sub2'])],
    )

    expect(valueOf(statistics, 'admin.female')).toBe(1)
    expect(valueOf(statistics, 'admin.male')).toBe(0)
  })

  it('counts one chief per company, from its latest approval', async () => {
    const older = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const { statistics } = await run(
      [company('a')],
      [
        { ...report('old', GenderEnum.MALE, ['a']), approvedAt: older },
        report('new', GenderEnum.FEMALE, ['a']),
      ],
    )

    expect(valueOf(statistics, 'admin.female')).toBe(1)
    expect(valueOf(statistics, 'admin.male')).toBe(0)
  })

  it('counts a company holding both report types once, latest approval first', async () => {
    // One company has one chief. The older equality plan still names the
    // previous one; the newer skýrslugjöf is the current answer.
    const older = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const { statistics } = await run(
      [company('a')],
      [
        { ...report('plan', GenderEnum.MALE, ['a']), approvedAt: older },
        {
          ...report('salary', GenderEnum.FEMALE, ['a']),
          type: ReportTypeEnum.SALARY,
        },
      ],
    )

    expect(valueOf(statistics, 'admin.female')).toBe(1)
    expect(valueOf(statistics, 'admin.male')).toBe(0)
  })

  it('ignores reports with no admin gender and inactive filers', async () => {
    // `run` only returns what the ACTIVE-company read would; `gone` is absent.
    const { statistics } = await run(
      [company('a')],
      [report('a', null), report('gone', GenderEnum.MALE)],
    )

    expect(valueOf(statistics, 'admin.male')).toBe(0)
  })

  it('withholds the national kynsegin count below the minimum cohort', async () => {
    const ids = ['a', 'b', 'c', 'd']
    const below = await run(
      ids.map((id) => company(id)),
      ids.map((id) => report(id, GenderEnum.NEUTRAL)),
    )
    expect(valueOf(below.statistics, 'admin.neutral')).toBeNull()

    const at = await run(
      [...ids, 'e'].map((id) => company(id)),
      [...ids, 'e'].map((id) => report(id, GenderEnum.NEUTRAL)),
    )
    expect(valueOf(at.statistics, 'admin.neutral')).toBe(5)
  })

  it('splits male and female chiefs by sector and region', async () => {
    const { statistics } = await run(
      [
        company('a', {
          sector: CompanySectorEnum.SVEITARFELAG,
          region: 'Austurland',
        }),
        company('b', {
          sector: CompanySectorEnum.SVEITARFELAG,
          region: 'Austurland',
        }),
        company('c', { sector: CompanySectorEnum.FYRIRTAEKI }),
      ],
      [
        report('a', GenderEnum.FEMALE),
        report('b', GenderEnum.MALE),
        report('c', GenderEnum.FEMALE),
      ],
      ['Austurland'],
    )

    const valueAt = (key: string, header: string) =>
      pointsOf(statistics, key).find((p) => p.header === header)?.value

    expect(valueAt('adminBySector.female', 'Sveitarfélög')).toBe(1)
    expect(valueAt('adminBySector.male', 'Sveitarfélög')).toBe(1)
    expect(valueAt('adminBySector.female', 'Fyrirtæki')).toBe(1)
    expect(valueAt('adminByRegion.female', 'Austurland')).toBe(1)
    expect(valueAt('adminByRegion.female', 'Óþekkt')).toBe(1)
  })

  it('never breaks kynsegin chiefs out by sector or region', async () => {
    // A cell of one would identify the person.
    const { statistics } = await run([])
    const keys = statistics.series.map((s) => s.key)

    expect(
      keys.filter((k) => /^admin(BySector|ByRegion)\.neutral$/.test(k)),
    ).toEqual([])
  })
})
