import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { RegionModel } from '../location/models/region.model'
import { ReportModel } from '../report/models/report.model'
import {
  AggregateStatisticsDto,
  AggregateStatisticUnitEnum,
} from './dto/aggregate-statistics.dto'
import { AggregateStatisticsService } from './aggregate-statistics.service'

/**
 * `header` is the MERGE KEY the island.is domain layer joins series on, by
 * exact string equality. Two series meant to share a chart must therefore emit
 * identical headers, point for point and in order.
 *
 * Today they do, but only because every series happens to be built from the
 * same `generatedAt` and the same month array. That is an invariant nobody
 * would notice breaking: a series added later that computes its own
 * `new Date()` still returns plausible-looking data, and the only symptom is a
 * chart rendering two unaligned rows instead of one merged one — which reads as
 * a data problem, not a bug in this file.
 *
 * So the invariant is asserted rather than assumed. The service is driven with
 * an empty database: the shape of the axes does not depend on the rows, and
 * these are assertions about headers, never about values.
 */
describe('aggregate statistics header alignment', () => {
  let statistics: AggregateStatisticsDto

  beforeAll(async () => {
    const emptyFindAll = { findAll: jest.fn().mockResolvedValue([]) }

    const module = await Test.createTestingModule({
      providers: [
        AggregateStatisticsService,
        { provide: LOGGER_PROVIDER, useValue: { info: jest.fn() } },
        { provide: getModelToken(CompanyModel), useValue: emptyFindAll },
        { provide: getModelToken(ReportModel), useValue: emptyFindAll },
        { provide: getModelToken(CompanyReportModel), useValue: emptyFindAll },
        {
          // Two real names: the landshluti axis is driven by this table rather
          // than by the companies present, and an empty one would hide exactly
          // the misalignment these tests exist to catch.
          provide: getModelToken(RegionModel),
          useValue: {
            findAll: jest
              .fn()
              .mockResolvedValue([
                { name: 'Austurland' },
                { name: 'Höfuðborgarsvæðið' },
              ]),
          },
        },
      ],
    }).compile()

    statistics = await module
      .get<AggregateStatisticsService>(AggregateStatisticsService)
      .getStatistics()
  })

  const headersOf = (key: string): string[] => {
    const found = statistics.series.find((s) => s.key === key)
    if (!found) throw new Error(`no series "${key}"`)
    return found.points.map((p) => p.header)
  }

  /** Every series whose key is not one of the other two axes. */
  const AS_OF = [
    'equality.obliged',
    'equality.complied',
    'equality.percent',
    'salary.obliged',
    'salary.complied',
    'salary.percent',
    'salary.employees',
    'payGap.raw',
    'payGap.oskyrt',
    'equality.voluntary',
    'salary.voluntary',
  ]

  const MONTHLY = [
    'equality.compliedOverTime',
    'salary.compliedOverTime',
    'equality.approvals',
    'salary.approvals',
    'payGap.rawOverTime',
    'payGap.oskyrtOverTime',
  ]

  const SECTOR = [
    'equalityBySector.obliged',
    'equalityBySector.complied',
    'salaryBySector.obliged',
    'salaryBySector.complied',
  ]

  const REGION = [
    'equalityByRegion.obliged',
    'equalityByRegion.complied',
    'salaryByRegion.obliged',
    'salaryByRegion.complied',
  ]

  const SIZE = ['equalityBySize.obliged', 'equalityBySize.complied']

  it('covers every series exactly once across the three axes', () => {
    // Otherwise a new series could be added and simply not be asserted here,
    // which is the failure this whole file exists to prevent.
    expect(
      [...AS_OF, ...MONTHLY, ...SECTOR, ...REGION, ...SIZE].sort(),
    ).toEqual(statistics.series.map((s) => s.key).sort())
  })

  it('gives every as-of series the identical single header', () => {
    const [first, ...rest] = AS_OF.map(headersOf)

    expect(first).toHaveLength(1)
    for (const headers of rest) expect(headers).toEqual(first)
  })

  it('gives every monthly series the identical header sequence', () => {
    const [first, ...rest] = MONTHLY.map(headersOf)

    expect(first.length).toBeGreaterThan(1)
    for (const headers of rest) expect(headers).toEqual(first)
  })

  it('gives every sector series the identical header sequence', () => {
    const [first, ...rest] = SECTOR.map(headersOf)

    expect(first).toEqual([
      'Óflokkað',
      'Fyrirtæki',
      'Ráðuneyti',
      'Ríkisaðilar',
      'Sveitarfélög',
    ])
    for (const headers of rest) expect(headers).toEqual(first)
  })

  it('gives every region series the identical header sequence', () => {
    const [first, ...rest] = REGION.map(headersOf)

    // Driven by the region table plus the unknown bucket, never by which
    // regions happen to have a company in them.
    expect(first).toEqual(['Austurland', 'Höfuðborgarsvæðið', 'Óþekkt'])
    for (const headers of rest) expect(headers).toEqual(first)
  })

  it('gives every size series the identical header sequence', () => {
    const [first, ...rest] = SIZE.map(headersOf)

    expect(first).toEqual(['25–49', '50+'])
    for (const headers of rest) expect(headers).toEqual(first)
  })

  it('keeps the axes mutually exclusive', () => {
    // A chart merges on header equality alone, so an as-of header colliding
    // with a monthly one would silently join a point to an unrelated month.
    const axes = [AS_OF, MONTHLY, SECTOR, REGION, SIZE].map(
      (group) => new Set(headersOf(group[0])),
    )

    for (const [i, a] of axes.entries()) {
      for (const b of axes.slice(i + 1)) {
        expect([...a].filter((header) => b.has(header))).toEqual([])
      }
    }
  })

  it('emits time headers as ms-epoch strings, per the chart convention', () => {
    for (const header of [...headersOf(AS_OF[0]), ...headersOf(MONTHLY[0])]) {
      expect(header).toMatch(/^\d+$/)
      expect(Number.isFinite(Number(header))).toBe(true)
    }
  })

  it('never reports a count as null or a suppressed figure as 0', () => {
    // Counts over an empty database are real zeroes. Derived figures have no
    // cohort behind them, so they must be null — publishing 0% would assert
    // "no pay gap" where the honest answer is "we cannot say".
    const valueOf = (key: string) =>
      statistics.series.find((s) => s.key === key)?.points[0]?.value

    expect(valueOf('equality.obliged')).toBe(0)
    expect(valueOf('equality.percent')).toBeNull()
    expect(valueOf('payGap.raw')).toBeNull()
    expect(valueOf('salary.employees')).toBeNull()
  })

  it('declares a unit on every series', () => {
    for (const s of statistics.series) {
      expect(Object.values(AggregateStatisticUnitEnum)).toContain(s.unit)
    }
  })
})

/**
 * The headcount sum is the one place a suppressed figure could still surface as
 * a real zero, and an empty database cannot show it: `SUM` over no rows returns
 * NULL whether or not the fix is present. The defect needs reports that ARE in
 * force and simply stated no figures — so this asserts the WHERE clause that
 * excludes them rather than the value it happens to produce.
 */
describe('headcount is summed only over reports that stated one', () => {
  it('constrains on the three count columns', async () => {
    const reportFindAll = jest.fn().mockResolvedValue([])
    const module = await Test.createTestingModule({
      providers: [
        AggregateStatisticsService,
        { provide: LOGGER_PROVIDER, useValue: { info: jest.fn() } },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getModelToken(ReportModel),
          useValue: { findAll: reportFindAll },
        },
        {
          provide: getModelToken(CompanyReportModel),
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getModelToken(RegionModel),
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile()

    await module
      .get<AggregateStatisticsService>(AggregateStatisticsService)
      .getStatistics()

    // ⚠️ Not `JSON.stringify`: Sequelize keys `Op.and` / `Op.or` with SYMBOLS,
    // which it drops silently — the clause under test would be invisible and
    // the assertion would fail against correct code.
    const columnsIn = (
      node: unknown,
      found = new Set<string>(),
    ): Set<string> => {
      if (node === null || typeof node !== 'object') return found

      if (Array.isArray(node)) {
        for (const item of node) columnsIn(item, found)
        return found
      }

      const record = node as Record<string | symbol, unknown>
      for (const key of Reflect.ownKeys(record)) {
        if (typeof key === 'string') found.add(key)
        columnsIn(record[key], found)
      }
      return found
    }

    const serialised = [
      ...reportFindAll.mock.calls.reduce(
        (all: Set<string>, [options]) => columnsIn(options?.where, all),
        new Set<string>(),
      ),
    ].join('|')

    // Without these, a report in force that stated no headcount contributes
    // `COALESCE(x, 0)` and publishes "0 starfsmenn" instead of nothing.
    expect(serialised).toContain('averageEmployeeMaleCount')
    expect(serialised).toContain('averageEmployeeFemaleCount')
    expect(serialised).toContain('averageEmployeeNeutralCount')
  })
})
