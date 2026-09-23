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
import { ReportTypeEnum } from '../report/models/report.enums'
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
}

type ReportFixture = {
  id: string
  type: ReportTypeEnum
  companyIds: string[]
  rawGapPercent?: number | null
  rawGapDirection?: WageGapDirectionEnum | null
}

const approvedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

const run = async (
  companies: CompanyFixture[],
  reports: ReportFixture[] = [],
) => {
  const companyFindAll = jest.fn().mockResolvedValue(
    companies.map((company) => ({
      id: company.id,
      sector: CompanySectorEnum.FYRIRTAEKI,
      employeeCountCategory: company.size,
      equalityCovered: company.equalityCovered ?? false,
      salaryCovered: company.salaryCovered ?? false,
      postcode: null,
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
            approvedAt,
            validUntil,
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
              report.companyIds.map((companyId) => ({
                reportId: report.id,
                companyId,
              })),
            ),
          ),
        },
      },
      {
        provide: getModelToken(RegionModel),
        useValue: { findAll: jest.fn().mockResolvedValue([]) },
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
