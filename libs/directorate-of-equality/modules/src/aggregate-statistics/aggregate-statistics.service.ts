import { fn, literal, Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CompanySectorEnum,
  CompanySizeEnum,
} from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { reportCovered } from '../company/utils/report-status'
import { PostcodeModel } from '../location/models/postcode.model'
import { RegionModel } from '../location/models/region.model'
import { WageGapDirectionEnum } from '../report/lib/wage-gap-decomposition'
import {
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import {
  AggregateStatisticsDto,
  AggregateStatisticSeriesDto,
  AggregateStatisticUnitEnum,
} from './dto/aggregate-statistics.dto'
import {
  coversMonth,
  MINIMUM_COHORT,
  monthsBetween,
  point,
  pointsToFraction,
  round,
  series,
  shareOf,
  suppressedMean,
  timeHeader,
} from './lib/aggregate'
import { IAggregateStatisticsService } from './aggregate-statistics.service.interface'

const LOGGING_CONTEXT = 'AggregateStatisticsService'

/** How far back the monthly series run. */
const SERIES_MONTHS = 60

/** Icelandic labels for the five sectors, as the published charts name them. */
const SECTOR_LABEL: Record<CompanySectorEnum, string> = {
  [CompanySectorEnum.FYRIRTAEKI]: 'Fyrirtæki',
  [CompanySectorEnum.RADUNEYTI]: 'Ráðuneyti',
  [CompanySectorEnum.RIKISADILI]: 'Ríkisaðilar',
  [CompanySectorEnum.SVEITARFELAG]: 'Sveitarfélög',
  [CompanySectorEnum.UNKNOWN]: 'Óflokkað',
}

/**
 * ⚠️ The two obligations have DIFFERENT populations, and conflating them is the
 * easiest way to publish a wrong headline.
 *
 * A jafnréttisáætlun is owed from 25 employees up; a skýrslugjöf from 50. So
 * "how many have complied" has no single answer and no single denominator —
 * every figure below is reported per obligation and none is summed into one.
 *
 * A company under 25 can owe a skýrslugjöf by individual arrangement
 * (`salary_report_required_override`). That is an agreement with one company
 * rather than a statement about the population, so it stays out of a published
 * denominator: including it would move the headline for reasons no reader
 * could see.
 */
const OBLIGED_SIZES: Record<ReportTypeEnum, CompanySizeEnum[]> = {
  [ReportTypeEnum.EQUALITY]: [CompanySizeEnum.MEDIUM, CompanySizeEnum.LARGE],
  [ReportTypeEnum.SALARY]: [CompanySizeEnum.LARGE],
}

/** The two things a company files. The whole taxonomy. */
const TYPE_LABEL: Record<ReportTypeEnum, string> = {
  [ReportTypeEnum.EQUALITY]: 'jafnréttisáætlun',
  [ReportTypeEnum.SALARY]: 'skýrslugjöf',
}

/**
 * Size buckets, for the breakdown of the obliged population.
 *
 * Only the two obliged buckets: a breakdown of "who the law reaches" has no
 * 0–24 row by construction, and an always-zero bar reads as a data problem.
 */
const SIZE_LABEL: Partial<Record<CompanySizeEnum, string>> = {
  [CompanySizeEnum.MEDIUM]: '25–49',
  [CompanySizeEnum.LARGE]: '50+',
}

/**
 * Bucket for a company with no postcode, so the region axis stays total.
 *
 * Dropping them would make the region bars sum to less than the headline with
 * no indication of where the difference went.
 */
const UNKNOWN_REGION = 'Óþekkt'

/** Series-key prefix per obligation. */
const TYPE_KEY: Record<ReportTypeEnum, string> = {
  [ReportTypeEnum.EQUALITY]: 'equality',
  [ReportTypeEnum.SALARY]: 'salary',
}

type CompanyRow = {
  id: string
  sector: CompanySectorEnum
  employeeCountCategory: CompanySizeEnum
  /** Landshluti name, or `UNKNOWN_REGION` when the company has no postcode. */
  region: string
  /**
   * Whether the obligation is met right now, by the register's own rule
   * (`reportCovered`): an in-force approved report naming the company — as the
   * filer or as a subsidiary of a group report — or a live legacy certificate.
   */
  covered: Record<ReportTypeEnum, boolean>
}

type ApprovedReportRow = {
  /** Every company the report covers: the filer and any group subsidiaries. */
  companyIds: string[]
  /** The filer — the `company_report` row with no parent. */
  filerCompanyId: string | null
  /** Frozen at submission: who signed off on THIS report. */
  companyAdminGender: GenderEnum | null
  type: ReportTypeEnum
  approvedAt: Date | null
  validUntil: Date | null
  /** Signed, in percent points: positive = í óhag kvenna, negative = í óhag karla. */
  rawGapPercent: number | null
  /** Signed, as `rawGapPercent`. */
  oskyrtPercent: number | null
}

@Injectable()
export class AggregateStatisticsService implements IAggregateStatisticsService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(ReportModel) private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(RegionModel)
    private readonly regionModel: typeof RegionModel,
  ) {}

  async getStatistics(): Promise<AggregateStatisticsDto> {
    const generatedAt = new Date()

    const [
      companies,
      approved,
      employeesWithEqualityReport,
      employeesWithSalaryReport,
      regions,
    ] = await Promise.all([
      this.loadCompanies(),
      this.loadApprovedReports(),
      this.loadEmployeesWithReport(ReportTypeEnum.EQUALITY),
      this.loadEmployeesWithReport(ReportTypeEnum.SALARY),
      this.loadRegionNames(),
    ])

    this.logger.info('Serving public statistics', {
      context: LOGGING_CONTEXT,
      companies: companies.length,
      approvedReports: approved.length,
    })

    return {
      generatedAt,
      minimumCohort: MINIMUM_COHORT,
      series: [
        ...this.obligationSeries(
          ReportTypeEnum.EQUALITY,
          companies,
          generatedAt,
          regions,
        ),
        ...this.obligationSeries(
          ReportTypeEnum.SALARY,
          companies,
          generatedAt,
          regions,
        ),
        ...this.sizeSeries(companies),
        ...this.employeeSeries(
          generatedAt,
          employeesWithEqualityReport,
          employeesWithSalaryReport,
        ),
        ...this.adminGenderSeries(generatedAt, companies, approved, regions),
        ...this.payGapNow(generatedAt, approved),
        ...this.overTime(generatedAt, companies, approved),
      ],
    }
  }

  // -------------------------------------------------------------------------
  // Per obligation
  // -------------------------------------------------------------------------

  /**
   * Obliged / complied / share, plus the sector breakdown, for ONE obligation.
   *
   * Built per type rather than once, because the population differs — see
   * `OBLIGED_SIZES`. Each series carries its own denominator, which is what
   * makes the two comparable at all.
   */
  private obligationSeries(
    type: ReportTypeEnum,
    companies: CompanyRow[],
    at: Date,
    regions: string[],
  ): AggregateStatisticSeriesDto[] {
    const key = TYPE_KEY[type]
    const label = TYPE_LABEL[type]
    const header = timeHeader(at)

    const obliged = companies.filter((company) =>
      OBLIGED_SIZES[type].includes(company.employeeCountCategory),
    )
    const obligedIds = new Set(obliged.map((company) => company.id))

    // Only obliged companies count toward the numerator. A voluntary filing by
    // a company the law does not reach is real, but counting it could push the
    // share past 100% and would answer a different question than the one the
    // denominator asks.
    const compliedIds = new Set(
      obliged
        .filter((company) => company.covered[type])
        .map((company) => company.id),
    )

    /**
     * Complied WITHOUT being obliged — the dashboard's "lokið án lagaskyldu".
     *
     * Deliberately its own figure rather than folded into `complied`: counting
     * it there could push the share past 100%, since it has no place in the
     * denominator. A company under the threshold that files anyway is a real
     * and separate fact.
     */
    const voluntary = new Set(
      companies
        .filter(
          (company) => company.covered[type] && !obligedIds.has(company.id),
        )
        .map((company) => company.id),
    )

    const sectors = Object.values(CompanySectorEnum)
    const bySector = (predicate: (company: CompanyRow) => boolean) =>
      sectors.map((sector) =>
        point(
          SECTOR_LABEL[sector],
          obliged.filter(
            (company) => company.sector === sector && predicate(company),
          ).length,
        ),
      )

    // Driven by the region TABLE, not by the companies present: a landshluti
    // with no obliged company still needs its bar, or the axis changes shape
    // between requests and stops merging with the other region series.
    const byRegion = (predicate: (company: CompanyRow) => boolean) =>
      regions.map((region) =>
        point(
          region,
          obliged.filter(
            (company) => company.region === region && predicate(company),
          ).length,
        ),
      )

    return [
      series(
        `${key}.obliged`,
        `Aðilar sem þurfa ${label}`,
        AggregateStatisticUnitEnum.COUNT,
        [point(header, obliged.length)],
      ),
      series(
        `${key}.complied`,
        `Aðilar með gilda ${label}`,
        AggregateStatisticUnitEnum.COUNT,
        [point(header, compliedIds.size)],
      ),
      series(
        `${key}.percent`,
        `Hlutfall með gilda ${label}`,
        AggregateStatisticUnitEnum.PERCENT,
        [point(header, shareOf(compliedIds.size, obliged.length))],
      ),
      series(
        `${key}BySector.obliged`,
        `Lagaskylda um ${label} eftir rekstrarformi`,
        AggregateStatisticUnitEnum.COUNT,
        bySector(() => true),
      ),
      series(
        `${key}BySector.complied`,
        `Gild ${label} eftir rekstrarformi`,
        AggregateStatisticUnitEnum.COUNT,
        bySector((company) => compliedIds.has(company.id)),
      ),
      series(
        `${key}ByRegion.obliged`,
        `Lagaskylda um ${label} eftir landshluta`,
        AggregateStatisticUnitEnum.COUNT,
        byRegion(() => true),
      ),
      series(
        `${key}ByRegion.complied`,
        `Gild ${label} eftir landshluta`,
        AggregateStatisticUnitEnum.COUNT,
        byRegion((company) => compliedIds.has(company.id)),
      ),
      series(
        `${key}.voluntary`,
        `Aðilar með gilda ${label} án lagaskyldu`,
        AggregateStatisticUnitEnum.COUNT,
        [point(header, voluntary.size)],
      ),
    ]
  }

  /**
   * The obliged population split by size bucket — the dashboard's
   * "jafnlaunavottun skylda" (50+) and "val um vottun eða staðfestingu" (25–49).
   *
   * Built from the JAFNRÉTTISÁÆTLUN population only, because it is the one that
   * spans both buckets: the skýrslugjöf obligation is 50+ by definition, so the
   * same split there would be one bar and an empty one.
   */
  private sizeSeries(companies: CompanyRow[]): AggregateStatisticSeriesDto[] {
    const sizes = Object.keys(SIZE_LABEL) as CompanySizeEnum[]
    const obliged = companies.filter((company) =>
      OBLIGED_SIZES[ReportTypeEnum.EQUALITY].includes(
        company.employeeCountCategory,
      ),
    )
    const compliedIds = new Set(
      obliged
        .filter((company) => company.covered[ReportTypeEnum.EQUALITY])
        .map((company) => company.id),
    )

    const bySize = (predicate: (company: CompanyRow) => boolean) =>
      sizes.map((size) =>
        point(
          SIZE_LABEL[size] as string,
          obliged.filter(
            (company) =>
              company.employeeCountCategory === size && predicate(company),
          ).length,
        ),
      )

    return [
      series(
        'equalityBySize.obliged',
        'Lagaskylda um jafnréttisáætlun eftir starfsmannafjölda',
        AggregateStatisticUnitEnum.COUNT,
        bySize(() => true),
      ),
      series(
        'equalityBySize.complied',
        'Gild jafnréttisáætlun eftir starfsmannafjölda',
        AggregateStatisticUnitEnum.COUNT,
        bySize((company) => compliedIds.has(company.id)),
      ),
    ]
  }

  /**
   * Headcount at companies holding a report in force, one figure per type.
   *
   * Kept per type rather than summed across both: a company holding both would
   * be counted twice. The report is the only real headcount the register holds
   * — a company row carries a size bucket and nothing finer.
   *
   * ⚠️ `equality.employees` undercounts. The headcount is optional on an
   * equality plan, so plans filed without it contribute nothing.
   */
  private employeeSeries(
    at: Date,
    equalityEmployees: number | null,
    salaryEmployees: number | null,
  ): AggregateStatisticSeriesDto[] {
    return [
      series(
        'equality.employees',
        'Starfsmenn hjá aðilum með gilda jafnréttisáætlun',
        AggregateStatisticUnitEnum.COUNT,
        [point(timeHeader(at), equalityEmployees)],
      ),
      series(
        'salary.employees',
        'Starfsmenn hjá aðilum með gilda skýrslugjöf',
        AggregateStatisticUnitEnum.COUNT,
        [point(timeHeader(at), salaryEmployees)],
      ),
    ]
  }

  /**
   * Gender of the æðsti stjórnandi at companies holding a report in force,
   * nationally and by sector and region.
   *
   * Across both report types, one chief per company: a company holding a
   * jafnréttisáætlun and a skýrslugjöf has one chief, not two. When the two
   * disagree, the latest approval is the more current answer. Only the FILER
   * counts — a group report names the parent's chief, not each subsidiary's.
   * Not restricted to the obliged population: a voluntary filer's chief is just
   * as real, and this series says nothing about compliance.
   *
   * ⚠️ Reports filed here only. The retired register keeps `top_manager_gender`
   * as free text, so legacy-certified companies are absent from every figure.
   *
   * ⚠️ NEUTRAL is published nationally only, and withheld under
   * `MINIMUM_COHORT`. Cut by sector or region, a cell of one would identify the
   * person, so the breakdowns carry male and female only.
   */
  private adminGenderSeries(
    at: Date,
    companies: CompanyRow[],
    approved: ApprovedReportRow[],
    regions: string[],
  ): AggregateStatisticSeriesDto[] {
    const header = timeHeader(at)
    const companiesById = new Map(
      companies.map((company) => [company.id, company]),
    )

    const latestByCompany = new Map<string, ApprovedReportRow>()
    for (const report of approved) {
      if (!coversMonth(report, at)) continue
      if (!report.filerCompanyId || !report.companyAdminGender) continue
      if (!companiesById.has(report.filerCompanyId)) continue

      const held = latestByCompany.get(report.filerCompanyId)
      if (
        !held ||
        (report.approvedAt?.getTime() ?? 0) > (held.approvedAt?.getTime() ?? 0)
      ) {
        latestByCompany.set(report.filerCompanyId, report)
      }
    }

    const chiefs = [...latestByCompany.entries()].map(
      ([companyId, report]) => ({
        company: companiesById.get(companyId) as CompanyRow,
        gender: report.companyAdminGender as GenderEnum,
      }),
    )

    const count = (
      gender: GenderEnum,
      where: (company: CompanyRow) => boolean = () => true,
    ) =>
      chiefs.filter((chief) => chief.gender === gender && where(chief.company))
        .length

    const neutral = count(GenderEnum.NEUTRAL)
    const sectors = Object.values(CompanySectorEnum)

    const breakdown = (gender: GenderEnum) => ({
      bySector: sectors.map((sector) =>
        point(
          SECTOR_LABEL[sector],
          count(gender, (company) => company.sector === sector),
        ),
      ),
      byRegion: regions.map((region) =>
        point(
          region,
          count(gender, (company) => company.region === region),
        ),
      ),
    })
    const male = breakdown(GenderEnum.MALE)
    const female = breakdown(GenderEnum.FEMALE)

    return [
      series(
        'admin.male',
        'Karlar sem æðstu stjórnendur',
        AggregateStatisticUnitEnum.COUNT,
        [point(header, count(GenderEnum.MALE))],
      ),
      series(
        'admin.female',
        'Konur sem æðstu stjórnendur',
        AggregateStatisticUnitEnum.COUNT,
        [point(header, count(GenderEnum.FEMALE))],
      ),
      series(
        'admin.neutral',
        'Kynsegin æðstu stjórnendur',
        AggregateStatisticUnitEnum.COUNT,
        [point(header, neutral < MINIMUM_COHORT ? null : neutral)],
      ),
      series(
        'adminBySector.male',
        'Karlar sem æðstu stjórnendur eftir rekstrarformi',
        AggregateStatisticUnitEnum.COUNT,
        male.bySector,
      ),
      series(
        'adminBySector.female',
        'Konur sem æðstu stjórnendur eftir rekstrarformi',
        AggregateStatisticUnitEnum.COUNT,
        female.bySector,
      ),
      series(
        'adminByRegion.male',
        'Karlar sem æðstu stjórnendur eftir landshluta',
        AggregateStatisticUnitEnum.COUNT,
        male.byRegion,
      ),
      series(
        'adminByRegion.female',
        'Konur sem æðstu stjórnendur eftir landshluta',
        AggregateStatisticUnitEnum.COUNT,
        female.byRegion,
      ),
    ]
  }

  private payGapNow(
    at: Date,
    approved: ApprovedReportRow[],
  ): AggregateStatisticSeriesDto[] {
    const header = timeHeader(at)
    const current = approved.filter(
      (report) =>
        report.type === ReportTypeEnum.SALARY && coversMonth(report, at),
    )

    return [
      series(
        'payGap.raw',
        'Óleiðréttur launamunur',
        AggregateStatisticUnitEnum.PERCENT,
        [point(header, gapMean(numbersOf(current, 'rawGapPercent')))],
      ),
      series(
        'payGap.oskyrt',
        'Óskýrður launamunur',
        AggregateStatisticUnitEnum.PERCENT,
        [point(header, gapMean(numbersOf(current, 'oskyrtPercent')))],
      ),
    ]
  }

  // -------------------------------------------------------------------------
  // Monthly series
  // -------------------------------------------------------------------------

  /**
   * ⚠️ Complied COUNT over time, never the SHARE over time.
   *
   * The denominator — who the law reaches — comes from a company's CURRENT size
   * bucket, and the register keeps no history of it. A share plotted backwards
   * would divide an old numerator by today's denominator and present the result
   * as a trend. The count is a fact; that ratio would be an artefact.
   *
   * ⚠️ Counts reports FILED HERE only, unlike the as-of `*.complied`, which also
   * counts live legacy certificates. A legacy row carries an expiry but no
   * reliable start of coverage, so placing it in past months would mean
   * inventing when it began. The series therefore starts low at go-live and
   * rises as companies re-file here — a real fact about this register, not
   * about compliance, and its latest point sits below `*.complied`.
   */
  private overTime(
    at: Date,
    companies: CompanyRow[],
    approved: ApprovedReportRow[],
  ): AggregateStatisticSeriesDto[] {
    const from = new Date(at)
    from.setUTCMonth(from.getUTCMonth() - (SERIES_MONTHS - 1))
    const months = monthsBetween(from, at)

    const obligedIds = (type: ReportTypeEnum) =>
      new Set(
        companies
          .filter((company) =>
            OBLIGED_SIZES[type].includes(company.employeeCountCategory),
          )
          .map((company) => company.id),
      )

    const compliedOverTime = (type: ReportTypeEnum) => {
      const ids = obligedIds(type)
      return months.map((month) =>
        point(
          timeHeader(month),
          new Set(
            approved
              .filter(
                (report) => report.type === type && coversMonth(report, month),
              )
              .flatMap((report) => report.companyIds)
              .filter((companyId) => ids.has(companyId)),
          ).size,
        ),
      )
    }

    const approvalsIn = (type: ReportTypeEnum) =>
      months.map((month) =>
        point(
          timeHeader(month),
          approved.filter(
            (report) =>
              report.type === type &&
              report.approvedAt !== null &&
              report.approvedAt.getUTCFullYear() === month.getUTCFullYear() &&
              report.approvedAt.getUTCMonth() === month.getUTCMonth(),
          ).length,
        ),
      )

    const salary = approved.filter(
      (report) => report.type === ReportTypeEnum.SALARY,
    )
    const gapOver = (field: 'rawGapPercent' | 'oskyrtPercent') =>
      months.map((month) =>
        point(
          timeHeader(month),
          gapMean(
            numbersOf(
              salary.filter((report) => coversMonth(report, month)),
              field,
            ),
          ),
        ),
      )

    return [
      series(
        'equality.compliedOverTime',
        'Gildar jafnréttisáætlanir eftir mánuðum',
        AggregateStatisticUnitEnum.COUNT,
        compliedOverTime(ReportTypeEnum.EQUALITY),
      ),
      series(
        'salary.compliedOverTime',
        'Gild skýrslugjöf eftir mánuðum',
        AggregateStatisticUnitEnum.COUNT,
        compliedOverTime(ReportTypeEnum.SALARY),
      ),
      series(
        'equality.approvals',
        'Samþykktar jafnréttisáætlanir',
        AggregateStatisticUnitEnum.COUNT,
        approvalsIn(ReportTypeEnum.EQUALITY),
      ),
      series(
        'salary.approvals',
        'Samþykkt skýrslugjöf',
        AggregateStatisticUnitEnum.COUNT,
        approvalsIn(ReportTypeEnum.SALARY),
      ),
      series(
        'payGap.rawOverTime',
        'Óleiðréttur launamunur eftir mánuðum',
        AggregateStatisticUnitEnum.PERCENT,
        gapOver('rawGapPercent'),
      ),
      series(
        'payGap.oskyrtOverTime',
        'Óskýrður launamunur eftir mánuðum',
        AggregateStatisticUnitEnum.PERCENT,
        gapOver('oskyrtPercent'),
      ),
    ]
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /**
   * Active register rows, with the three attributes every figure is cut by and
   * whether each obligation is currently covered.
   *
   * Coverage is read with the register's own SQL (`reportCovered`) rather than
   * rebuilt from report rows here, so the published `*.complied` can never
   * disagree with the admin register about the same company — including the
   * legacy-certified and group-subsidiary cases an approved-report scan misses.
   */
  private async loadCompanies(): Promise<CompanyRow[]> {
    const rows = ((await this.companyModel.findAll({
      attributes: [
        'id',
        'sector',
        'employeeCountCategory',
        [literal(reportCovered(ReportTypeEnum.EQUALITY)), 'equalityCovered'],
        [literal(reportCovered(ReportTypeEnum.SALARY)), 'salaryCovered'],
      ],
      where: { status: 'ACTIVE' },
      include: [
        {
          model: PostcodeModel,
          as: 'postcode',
          attributes: ['id'],
          // `required: false` — a company with no postcode still belongs in
          // every total; it lands in the `Óþekkt` bucket rather than vanishing.
          required: false,
          include: [
            {
              model: RegionModel,
              as: 'region',
              attributes: ['name'],
              required: false,
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    })) as unknown) as Array<{
      id: string
      sector: CompanySectorEnum
      employeeCountCategory: CompanySizeEnum
      equalityCovered: boolean | null
      salaryCovered: boolean | null
      postcode?: { region?: { name?: string | null } | null } | null
    }>

    return rows.map((row) => ({
      id: row.id,
      sector: row.sector,
      employeeCountCategory: row.employeeCountCategory,
      region: row.postcode?.region?.name ?? UNKNOWN_REGION,
      covered: {
        [ReportTypeEnum.EQUALITY]: row.equalityCovered === true,
        [ReportTypeEnum.SALARY]: row.salaryCovered === true,
      },
    }))
  }

  /**
   * The landshluti axis, from the reference table plus the unknown bucket.
   *
   * Read from `region` rather than derived from the companies so the axis is
   * the same eight values on every request. Derived from the data, a region
   * with no obliged company would drop out and the series would stop merging
   * with its neighbour on the same chart.
   */
  private async loadRegionNames(): Promise<string[]> {
    const rows = ((await this.regionModel.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']],
      raw: true,
    })) as unknown) as Array<{ name: string }>

    return [...rows.map((row) => row.name), UNKNOWN_REGION]
  }

  /**
   * Every approved filing, with its pay-gap figures extracted in SQL and every
   * company it covers.
   *
   * ⚠️ The gap percentages are pulled out with `->>` rather than by loading
   * `wage_gap_decomposition_snapshot`. That column carries a per-employee array,
   * so selecting it would move the whole salary dataset into this process to
   * read two numbers off each row — on a public endpoint, repeatedly.
   *
   * The covered companies come from a second read rather than a join, so a
   * group report stays ONE row: joining `company_report` would repeat it per
   * subsidiary and weight its pay gap and its approval that many times.
   */
  private async loadApprovedReports(): Promise<ApprovedReportRow[]> {
    const snapshotField = (field: string) =>
      literal(
        `(SELECT rr."wage_gap_decomposition_snapshot"->>'${field}' FROM "report_result" rr WHERE rr."report_id" = "ReportModel"."id")`,
      )

    const rows = ((await this.reportModel.findAll({
      attributes: [
        'id',
        'type',
        'approvedAt',
        'validUntil',
        'companyAdminGender',
        [snapshotField('rawGapPercent'), 'rawGapPercent'],
        [snapshotField('rawGapDirection'), 'rawGapDirection'],
        [snapshotField('oskyrtPercent'), 'oskyrtPercent'],
        [snapshotField('oskyrtDirection'), 'oskyrtDirection'],
      ],
      where: { status: ReportStatusEnum.APPROVED },
      raw: true,
    })) as unknown) as Array<{
      id: string
      type: ReportTypeEnum
      approvedAt: Date | null
      validUntil: Date | null
      companyAdminGender: GenderEnum | null
      rawGapPercent: string | number | null
      rawGapDirection: string | null
      oskyrtPercent: string | number | null
      oskyrtDirection: string | null
    }>

    if (rows.length === 0) return []

    const links = ((await this.companyReportModel.findAll({
      attributes: ['reportId', 'companyId', 'parentCompanyId'],
      where: { reportId: rows.map((row) => row.id) },
      raw: true,
    })) as unknown) as Array<{
      reportId: string
      companyId: string
      parentCompanyId: string | null
    }>

    const companiesByReport = new Map<string, string[]>()
    const filerByReport = new Map<string, string>()
    for (const link of links) {
      const ids = companiesByReport.get(link.reportId) ?? []
      ids.push(link.companyId)
      companiesByReport.set(link.reportId, ids)
      if (link.parentCompanyId === null) {
        filerByReport.set(link.reportId, link.companyId)
      }
    }

    return rows
      .filter((row) => companiesByReport.has(row.id))
      .map((row) => ({
        companyIds: companiesByReport.get(row.id) ?? [],
        filerCompanyId: filerByReport.get(row.id) ?? null,
        companyAdminGender: row.companyAdminGender,
        type: row.type,
        approvedAt: row.approvedAt ? new Date(row.approvedAt) : null,
        validUntil: row.validUntil ? new Date(row.validUntil) : null,
        rawGapPercent: signedGap(
          toNumber(row.rawGapPercent),
          row.rawGapDirection,
        ),
        oskyrtPercent: signedGap(
          toNumber(row.oskyrtPercent),
          row.oskyrtDirection,
        ),
      }))
  }

  /**
   * Headcount summed across reports of `type` still in force, or null when none
   * of them stated one.
   *
   * ⚠️ The `Op.or` on the three count columns is what keeps a real total apart
   * from an absent one. `COALESCE(x, 0)` inside the SUM is right for a report
   * that stated two of the three figures — an unstated NEUTRAL count is zero
   * people — but applied to a report that stated none it would contribute 0 and
   * turn "nobody reported a headcount" into a published "0 starfsmenn". With
   * the filter, a set with no figures at all matches no rows, `SUM` returns
   * NULL, and the point is suppressed rather than asserted as zero.
   */
  private async loadEmployeesWithReport(
    type: ReportTypeEnum,
  ): Promise<number | null> {
    const rows = ((await this.reportModel.findAll({
      attributes: [
        [
          fn(
            'SUM',
            literal(
              'COALESCE(average_employee_male_count, 0) + COALESCE(average_employee_female_count, 0) + COALESCE(average_employee_neutral_count, 0)',
            ),
          ),
          'total',
        ],
      ],
      where: {
        status: ReportStatusEnum.APPROVED,
        type,
        [Op.and]: [
          {
            [Op.or]: [
              { validUntil: { [Op.is]: null } },
              { validUntil: { [Op.gte]: new Date() } },
            ],
          },
          {
            [Op.or]: [
              { averageEmployeeMaleCount: { [Op.not]: null } },
              { averageEmployeeFemaleCount: { [Op.not]: null } },
              { averageEmployeeNeutralCount: { [Op.not]: null } },
            ],
          },
        ],
      },
      raw: true,
    })) as unknown) as [{ total: string | null }]

    const total = toNumber(rows[0]?.total)
    return total === null ? null : round(total)
  }
}

/**
 * Unsigned gap and its direction as one signed figure: positive = í óhag
 * kvenna, negative = í óhag karla.
 *
 * ⚠️ The snapshot keeps the magnitude unsigned (the 3,9% test is
 * direction-agnostic), but a MEAN of magnitudes is not a gap: five companies at
 * 4% one way and five at 4% the other would publish "4% launamunur" where the
 * gaps cancel. A value whose direction is missing cannot be signed, so it is
 * left out rather than guessed.
 */
const signedGap = (
  percent: number | null,
  direction: string | null,
): number | null => {
  if (percent === null) return null
  if (direction === WageGapDirectionEnum.FEMALE) return percent
  if (direction === WageGapDirectionEnum.MALE) return -percent
  if (direction === WageGapDirectionEnum.NONE) return 0
  return null
}

/** Mean pay gap as a fraction; snapshots store the gap in percent points. */
const gapMean = (values: number[]): number | null =>
  pointsToFraction(suppressedMean(values))

const numbersOf = (
  rows: ApprovedReportRow[],
  field: 'rawGapPercent' | 'oskyrtPercent',
): number[] =>
  rows
    .map((row) => row[field])
    .filter((value): value is number => value !== null)

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
