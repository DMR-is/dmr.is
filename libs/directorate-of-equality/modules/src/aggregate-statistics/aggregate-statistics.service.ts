import { literal } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import {
  activeLegacyCertificationExists,
  activeReportExists,
  COMPANY_QUERY_ALIAS,
  legacyCertificationInForceSql,
} from '../company/utils/report-status'
import { DoeModels } from '../constants'
import { PostcodeModel } from '../location/models/postcode.model'
import { RegionModel } from '../location/models/region.model'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.enums'
import { AggregateStatisticsDto } from './dto/aggregate-statistics.dto'
import {
  companyCells,
  CompanyStatisticsRow,
  employeesByStatus,
  MINIMUM_COHORT,
  roundCells,
  UNKNOWN_REGION,
} from './lib/aggregate'
import { DailyCache } from './lib/daily-cache'
import { IAggregateStatisticsService } from './aggregate-statistics.service.interface'

const LOGGING_CONTEXT = 'AggregateStatisticsService'

const COMPANY_ID = `"${COMPANY_QUERY_ALIAS}"."id"`

/** Sum of three nullable counts, or NULL when all three are NULL. */
const headcountSql = (a: string, b: string, c: string) =>
  `CASE WHEN ${a} IS NULL AND ${b} IS NULL AND ${c} IS NULL THEN NULL
    ELSE COALESCE(${a}, 0) + COALESCE(${b}, 0) + COALESCE(${c}, 0) END`

/** A column off the company's in-force legacy salary certificate (latest row wins). */
const inForceLegacySql = (expression: string) => `(
  SELECT ${expression} FROM "${DoeModels.LEGACY_REPORT}" lr
  WHERE lr.company_id = ${COMPANY_ID}
  AND ${legacyCertificationInForceSql(ReportTypeEnum.SALARY)}
  ORDER BY lr.legacy_modified_at DESC NULLS LAST
  LIMIT 1
)`

const LEGACY_ROUND_SQL = `(
  SELECT lr.round FROM "${DoeModels.LEGACY_REPORT}" lr
  WHERE lr.company_id = ${COMPANY_ID}
  ORDER BY lr.legacy_modified_at DESC NULLS LAST
  LIMIT 1
)`

const LEGACY_HEADCOUNT_SQL = inForceLegacySql(
  `COALESCE(lr.employee_count, ${headcountSql(
    'lr.male_count',
    'lr.female_count',
    'lr.neutral_count',
  )})`,
)

// Filer only: a group report states the group's headcount, so counting it on
// every subsidiary would multiply it.
const REPORT_HEADCOUNT_SQL = `(
  SELECT ${headcountSql(
    'r.average_employee_male_count',
    'r.average_employee_female_count',
    'r.average_employee_neutral_count',
  )}
  FROM "${DoeModels.COMPANY_REPORT}" cr
  JOIN "${DoeModels.REPORT}" r ON r.id = cr.report_id
  WHERE cr.company_id = ${COMPANY_ID}
  AND cr.parent_company_id IS NULL
  AND r.type = '${ReportTypeEnum.SALARY}'
  AND r.status = '${ReportStatusEnum.APPROVED}'
  AND r.valid_until > NOW()
  ORDER BY r.approved_at DESC NULLS LAST
  LIMIT 1
)`

// Each approved skýrslugjöf is one validity round. SUPERSEDED reports are left
// out: a re-filing replaces the earlier report, it does not start a new round.
const APPROVED_SALARY_REPORTS_SQL = `(
  SELECT COUNT(DISTINCT r.id)
  FROM "${DoeModels.COMPANY_REPORT}" cr
  JOIN "${DoeModels.REPORT}" r ON r.id = cr.report_id
  WHERE cr.company_id = ${COMPANY_ID}
  AND r.type = '${ReportTypeEnum.SALARY}'
  AND r.status = '${ReportStatusEnum.APPROVED}'
)`

type CompanyQueryRow = {
  sector: CompanySectorEnum
  employeeCountCategory: CompanySizeEnum
  salaryReportActive: boolean | null
  legacySalaryInForce: boolean | null
  legacyCertificationType: string | null
  legacyRound: string | null
  approvedSalaryReports: string | number | null
  reportHeadcount: string | number | null
  legacyHeadcount: string | number | null
  postcode?: { region?: { name?: string | null } | null } | null
}

@Injectable()
export class AggregateStatisticsService implements IAggregateStatisticsService {
  private readonly cache = new DailyCache<
    Omit<AggregateStatisticsDto, 'expiresAt'>
  >((now) => this.compute(now))

  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(RegionModel)
    private readonly regionModel: typeof RegionModel,
  ) {}

  async getStatistics(): Promise<AggregateStatisticsDto> {
    const { value, expiresAt } = await this.cache.get()
    return { ...value, expiresAt }
  }

  private async compute(
    now: Date,
  ): Promise<Omit<AggregateStatisticsDto, 'expiresAt'>> {
    try {
      const [companies, regions] = await Promise.all([
        this.loadCompanies(),
        this.loadRegionNames(),
      ])

      this.logger.info('Computed public statistics', {
        context: LOGGING_CONTEXT,
        companies: companies.length,
      })

      return {
        generatedAt: now,
        minimumCohort: MINIMUM_COHORT,
        regions,
        companies: companyCells(companies),
        rounds: roundCells(companies),
        employees: employeesByStatus(companies),
      }
    } catch (error) {
      this.logger.error('Failed to compute public statistics', {
        context: LOGGING_CONTEXT,
        error,
      })
      throw error
    }
  }

  private async loadCompanies(): Promise<CompanyStatisticsRow[]> {
    const rows = ((await this.companyModel.findAll({
      attributes: [
        'sector',
        'employeeCountCategory',
        [
          literal(activeReportExists(ReportTypeEnum.SALARY)),
          'salaryReportActive',
        ],
        [
          literal(activeLegacyCertificationExists(ReportTypeEnum.SALARY)),
          'legacySalaryInForce',
        ],
        [
          literal(inForceLegacySql('lr.certification_type')),
          'legacyCertificationType',
        ],
        [literal(LEGACY_ROUND_SQL), 'legacyRound'],
        [literal(APPROVED_SALARY_REPORTS_SQL), 'approvedSalaryReports'],
        [literal(REPORT_HEADCOUNT_SQL), 'reportHeadcount'],
        [literal(LEGACY_HEADCOUNT_SQL), 'legacyHeadcount'],
      ],
      where: { status: CompanyStatusEnum.ACTIVE },
      include: [
        {
          model: PostcodeModel,
          as: 'postcode',
          attributes: ['id'],
          // A company with no postcode still counts, in the `Óþekkt` bucket.
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
    })) as unknown) as CompanyQueryRow[]

    return rows.map((row) => ({
      region: row.postcode?.region?.name ?? UNKNOWN_REGION,
      size: row.employeeCountCategory,
      sector: row.sector,
      salaryReportActive: row.salaryReportActive === true,
      legacySalaryInForce: row.legacySalaryInForce === true,
      legacyCertificationType: row.legacyCertificationType,
      legacyRound: row.legacyRound,
      // COUNT comes back from pg as a string.
      approvedSalaryReports: toHeadcount(row.approvedSalaryReports) ?? 0,
      reportHeadcount: toHeadcount(row.reportHeadcount),
      legacyHeadcount: toHeadcount(row.legacyHeadcount),
    }))
  }

  /** Read from the reference table so the region axis is stable across days. */
  private async loadRegionNames(): Promise<string[]> {
    const rows = ((await this.regionModel.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']],
      raw: true,
    })) as unknown) as Array<{ name: string }>

    return [...rows.map((row) => row.name), UNKNOWN_REGION]
  }
}

/** Report headcounts are DECIMAL averages; published as whole people. */
const toHeadcount = (value: string | number | null): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}
