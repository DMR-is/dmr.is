import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { RegionModel } from '../location/models/region.model'
import { StatisticsCertificationStatusEnum as Status } from './dto/aggregate-statistics.dto'
import { UNKNOWN_REGION } from './lib/aggregate'
import { AggregateStatisticsService } from './aggregate-statistics.service'

/**
 * The service's own responsibilities: reading the register query into rows,
 * the region axis and the daily cache. How cells are counted is covered by
 * `lib/aggregate.spec.ts`.
 */

type QueryRow = {
  sector?: CompanySectorEnum
  employeeCountCategory?: CompanySizeEnum
  salaryReportActive?: boolean | null
  legacySalaryInForce?: boolean | null
  legacyCertificationType?: string | null
  legacyRound?: string | null
  reportHeadcount?: string | number | null
  legacyHeadcount?: string | number | null
  region?: string | null
}

const setup = async (rows: QueryRow[], regions: string[] = []) => {
  const companyFindAll = jest.fn().mockResolvedValue(
    rows.map((row) => ({
      sector: row.sector ?? CompanySectorEnum.FYRIRTAEKI,
      employeeCountCategory: row.employeeCountCategory ?? CompanySizeEnum.LARGE,
      salaryReportActive: row.salaryReportActive ?? false,
      legacySalaryInForce: row.legacySalaryInForce ?? false,
      legacyCertificationType: row.legacyCertificationType ?? null,
      legacyRound: row.legacyRound ?? null,
      reportHeadcount: row.reportHeadcount ?? null,
      legacyHeadcount: row.legacyHeadcount ?? null,
      postcode: row.region ? { region: { name: row.region } } : null,
    })),
  )
  const regionFindAll = jest
    .fn()
    .mockResolvedValue(regions.map((name) => ({ name })))

  const module = await Test.createTestingModule({
    providers: [
      AggregateStatisticsService,
      {
        provide: LOGGER_PROVIDER,
        useValue: { info: jest.fn(), error: jest.fn() },
      },
      {
        provide: getModelToken(CompanyModel),
        useValue: { findAll: companyFindAll },
      },
      {
        provide: getModelToken(RegionModel),
        useValue: { findAll: regionFindAll },
      },
    ],
  }).compile()

  return {
    service: module.get(AggregateStatisticsService),
    companyFindAll,
  }
}

describe('AggregateStatisticsService', () => {
  it('reads ACTIVE companies only', async () => {
    const { service, companyFindAll } = await setup([])
    await service.getStatistics()

    expect(companyFindAll.mock.calls[0][0].where).toEqual({
      status: CompanyStatusEnum.ACTIVE,
    })
  })

  it('counts only the filer of a report toward headcount', async () => {
    const { service, companyFindAll } = await setup([])
    await service.getStatistics()

    const sql = JSON.stringify(companyFindAll.mock.calls[0][0].attributes)
    expect(sql).toContain('parent_company_id IS NULL')
  })

  it('puts a company with no postcode in the unknown region, and lists it on the axis', async () => {
    const { service } = await setup([{ region: null }], ['Vesturland'])
    const statistics = await service.getStatistics()

    expect(statistics.regions).toEqual(['Vesturland', UNKNOWN_REGION])
    expect(statistics.companies[0].region).toBe(UNKNOWN_REGION)
  })

  it('treats only a literal true from SQL as in force', async () => {
    const { service } = await setup([
      { legacySalaryInForce: null, legacyCertificationType: 'Vottun' },
    ])
    const statistics = await service.getStatistics()

    expect(statistics.companies[0].status).toBe(Status.NONE)
  })

  it('rounds decimal report headcounts to whole people', async () => {
    const { service } = await setup(
      Array.from({ length: 5 }, () => ({
        salaryReportActive: true,
        reportHeadcount: '10.40',
      })),
    )
    const statistics = await service.getStatistics()

    expect(
      statistics.employees.find((e) => e.status === Status.SKYRSLUGJOF)
        ?.employees,
    ).toBe(50)
  })

  it('scans the register once per day, not once per request', async () => {
    const { service, companyFindAll } = await setup([{}])

    const first = await service.getStatistics()
    const second = await service.getStatistics()

    expect(companyFindAll).toHaveBeenCalledTimes(1)
    expect(second.generatedAt).toEqual(first.generatedAt)
    expect(first.expiresAt.getTime()).toBeGreaterThan(
      first.generatedAt.getTime(),
    )
  })
})
