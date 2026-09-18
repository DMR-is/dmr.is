import { Op } from 'sequelize'

import { Inject, Injectable, PayloadTooLargeException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../company/company.service.interface'
import { GetCompaniesQueryDto } from '../company/dto/get-companies-query.dto'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IsatCategoryModel } from '../company/models/isat-category.model'
import { PostcodeModel } from '../location/models/postcode.model'
import { RegionModel } from '../location/models/region.model'
import { GetReportsQueryDto } from '../report/dto/get-reports.query.dto'
import { computeIncludesImprovementPlan } from '../report/lib/improvement-plan'
import { ReportStatusEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { buildReportListWhere } from '../report/utils/filters'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportResultModel } from '../report-result/models/report-result.model'
import {
  DataExportFileDto,
  DataExportFormatEnum,
} from './dto/data-export.dto'
import {
  COMPANY_EXPORT_COLUMNS,
  type ExportColumn,
  REPORT_EXPORT_COLUMNS,
} from './lib/columns'
import type {
  CompanyEmployeeCounts,
  CompanyExportRow,
  ReportExportRow,
} from './lib/rows'
import {
  CSV_MIME,
  type ExportMetadata,
  writeCsv,
  writeXlsx,
  XLSX_MIME,
} from './lib/writer'
import { IDataExportService } from './data-export.service.interface'

const LOGGING_CONTEXT = 'DataExportService'

/**
 * Hard ceiling on an export, well above anything the register can produce
 * today (~1 800 companies, a few thousand reports).
 *
 * It exists so a filter that accidentally matches everything fails loudly
 * instead of building a multi-hundred-megabyte workbook in memory and taking
 * the API down with it. If this is ever hit legitimately, the fix is streaming,
 * not a bigger number.
 */
const MAX_EXPORT_ROWS = 50_000

/** Location lookup, keyed by `postcode.id`. */
type LocationLookup = Map<string, { code: string; place: string; region: string | null }>

/** ÍSAT lookup, keyed by leaf `code`. */
type IsatLookup = Map<string, { section: string; description: string }>

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

@Injectable()
export class DataExportService implements IDataExportService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
    @InjectModel(ReportModel) private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportResultModel)
    private readonly reportResultModel: typeof ReportResultModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(PostcodeModel)
    private readonly postcodeModel: typeof PostcodeModel,
    @InjectModel(IsatCategoryModel)
    private readonly isatCategoryModel: typeof IsatCategoryModel,
  ) {}

  async exportCompanies(
    query: GetCompaniesQueryDto,
    format: DataExportFormatEnum,
    filterSummary: string[],
  ): Promise<DataExportFileDto> {
    // The same read the register list runs, unpaged — see `findAllByFilter`.
    const companies = await this.companyService.findAllByFilter(query)
    this.assertWithinLimit(companies.length)

    const [locations, employeeCounts] = await Promise.all([
      this.loadLocations(),
      this.loadLatestEmployeeCounts(companies.map((company) => company.id)),
    ])

    const rows: CompanyExportRow[] = companies.map((company) => {
      const location = company.postcodeId
        ? locations.get(company.postcodeId)
        : undefined

      return {
        company,
        postcode: location?.code ?? null,
        place: location?.place ?? null,
        region: location?.region ?? null,
        employeeCounts: employeeCounts.get(company.id) ?? null,
      }
    })

    return this.render(
      rows,
      COMPANY_EXPORT_COLUMNS,
      'Fyrirtæki',
      format,
      filterSummary,
    )
  }

  async exportReports(
    query: GetReportsQueryDto,
    format: DataExportFormatEnum,
    filterSummary: string[],
  ): Promise<DataExportFileDto> {
    // `buildReportListWhere` is the list's own builder, so the export resolves
    // to exactly the reports the screen showed. `subQuery: false` for the same
    // reason the list sets it: the free-text filter reaches into joined columns.
    const reports = await this.reportModel.scope('listview').findAll({
      where: buildReportListWhere(query),
      order: [['createdAt', 'DESC']],
      subQuery: false,
    })
    this.assertWithinLimit(reports.length)

    const reportIds = reports.map((report) => report.id)

    const [results, improvementPlans, locations, isat] = await Promise.all([
      this.loadResults(reportIds),
      computeIncludesImprovementPlan(
        this.reportEmployeeOutlierModel,
        reportIds,
      ),
      this.loadLocations(),
      this.loadIsat(),
    ])

    const rows = reports.map((report) =>
      this.toReportRow(
        report,
        results.get(report.id),
        improvementPlans.get(report.id) ?? false,
        locations,
        isat,
      ),
    )

    return this.render(
      rows,
      REPORT_EXPORT_COLUMNS,
      'Skýrslur',
      format,
      filterSummary,
    )
  }

  // -------------------------------------------------------------------------

  private assertWithinLimit(rowCount: number): void {
    if (rowCount <= MAX_EXPORT_ROWS) return

    this.logger.warn(
      `Refusing export of ${rowCount} rows (limit ${MAX_EXPORT_ROWS})`,
      { context: LOGGING_CONTEXT, rowCount },
    )
    throw new PayloadTooLargeException(
      `Útdrátturinn nær til ${rowCount} raða, sem er yfir hámarkinu (${MAX_EXPORT_ROWS}). Þrengdu síurnar.`,
    )
  }

  private async render<TRow>(
    rows: TRow[],
    columns: ExportColumn<TRow>[],
    title: string,
    format: DataExportFormatEnum,
    filterSummary: string[],
  ): Promise<DataExportFileDto> {
    const generatedAt = new Date()
    const stamp = generatedAt.toISOString().slice(0, 10)
    const isCsv = format === DataExportFormatEnum.CSV

    this.logger.info(`Exporting ${rows.length} ${title} rows as ${format}`, {
      context: LOGGING_CONTEXT,
      rowCount: rows.length,
      format,
    })

    const metadata: ExportMetadata = {
      title,
      generatedAt,
      rowCount: rows.length,
      filters: filterSummary,
    }

    return {
      fileName: `jafnrettisstofa-${title.toLowerCase()}-${stamp}.${format}`,
      contentType: isCsv ? CSV_MIME : XLSX_MIME,
      rowCount: rows.length,
      content: isCsv
        ? writeCsv(rows, columns)
        : await writeXlsx(rows, columns, metadata),
    }
  }

  /**
   * Every postcode with its region, as one lookup.
   *
   * There are ~150 postcodes in Iceland, so this is cheaper than resolving them
   * per row and cheaper than widening the company query with another join that
   * only the export needs.
   */
  private async loadLocations(): Promise<LocationLookup> {
    const rows = await this.postcodeModel.findAll({
      include: [{ model: RegionModel, as: 'region', required: false }],
    })

    return new Map(
      rows.map((row) => [
        row.id,
        {
          code: row.code,
          place: row.place,
          region: row.region?.name ?? null,
        },
      ]),
    )
  }

  /** The 665 ÍSAT leaves, as one lookup. Same reasoning as `loadLocations`. */
  private async loadIsat(): Promise<IsatLookup> {
    const rows = await this.isatCategoryModel.findAll()

    return new Map(
      rows.map((row) => [
        row.code,
        { section: row.section, description: row.description },
      ]),
    )
  }

  private async loadResults(
    reportIds: string[],
  ): Promise<Map<string, ReportResultModel>> {
    if (reportIds.length === 0) return new Map()

    const rows = await this.reportResultModel.findAll({
      where: { reportId: { [Op.in]: reportIds } },
    })

    return new Map(rows.map((row) => [row.reportId, row]))
  }

  /**
   * Submitted headcount per company, from its most recent APPROVED report.
   *
   * The company row holds only a size bucket, so this is the only real
   * headcount in the system — and summing it is the only way to answer "how
   * many people are covered". Restricted to APPROVED on purpose: a submitted
   * but unreviewed report is a claim, not a fact, and a denied one is a
   * rejected claim.
   *
   * Reads the PARENT snapshot only (`parentCompanyId: null`), so a subsidiary
   * on a group filing does not inherit the parent's headcount as its own.
   */
  private async loadLatestEmployeeCounts(
    companyIds: string[],
  ): Promise<Map<string, CompanyEmployeeCounts>> {
    const counts = new Map<string, CompanyEmployeeCounts>()
    if (companyIds.length === 0) return counts

    const rows = await this.companyReportModel.findAll({
      where: { companyId: { [Op.in]: companyIds }, parentCompanyId: null },
      include: [
        {
          model: ReportModel,
          as: 'report',
          required: true,
          where: { status: ReportStatusEnum.APPROVED },
        },
      ],
      // Newest approval first, so the first row seen per company wins.
      order: [[{ model: ReportModel, as: 'report' }, 'approvedAt', 'DESC']],
    })

    for (const row of rows) {
      if (counts.has(row.companyId)) continue

      const report = row.report
      if (!report) continue

      const male = toNumber(report.averageEmployeeMaleCount)
      const female = toNumber(report.averageEmployeeFemaleCount)
      const neutral = toNumber(report.averageEmployeeNeutralCount)

      // `total` is null only when NONE of the three was reported. A report that
      // named 40 men and no women means zero women, not an unknown total.
      const parts = [male, female, neutral].filter(
        (part): part is number => part !== null,
      )

      counts.set(row.companyId, {
        male,
        female,
        neutral,
        total: parts.length
          ? parts.reduce((sum, part) => sum + part, 0)
          : null,
        reportedAt: report.approvedAt ?? null,
      })
    }

    return counts
  }

  private toReportRow(
    report: ReportModel,
    result: ReportResultModel | undefined,
    includesImprovementPlan: boolean,
    locations: LocationLookup,
    isat: IsatLookup,
  ): ReportExportRow {
    const company = report.companyReport?.company ?? null
    const location = company?.postcodeId
      ? locations.get(company.postcodeId)
      : undefined
    const isatEntry = company?.isatCategoryCode
      ? isat.get(company.isatCategoryCode)
      : undefined

    const gap = result?.wageGapDecompositionSnapshot

    return {
      id: report.id,
      identifier: report.identifier,
      type: report.type,
      status: report.status,
      communicationStatus: report.communicationStatus,
      equalitySource: report.equalitySource,

      companyName: report.companyReport?.name ?? null,
      companyNationalId: report.companyReport?.nationalId ?? null,
      // The company's CURRENT bucket where we have the company, falling back to
      // the snapshot for a report whose company row has since gone.
      companyEmployeeCountCategory:
        company?.employeeCountCategory ??
        report.companyReport?.employeeCountCategory ??
        null,
      companySector: company?.sector ?? null,
      companyIsatSection: isatEntry?.section ?? null,
      companyIsatDescription: isatEntry?.description ?? null,
      postcode: location?.code ?? null,
      region: location?.region ?? null,

      createdAt: report.createdAt ?? null,
      approvedAt: report.approvedAt ?? null,
      validUntil: report.validUntil ?? null,
      correctionDeadline: report.correctionDeadline ?? null,
      reviewerName: report.reviewer
        ? `${report.reviewer.firstName} ${report.reviewer.lastName}`.trim()
        : null,
      includesImprovementPlan,

      companyAdminName: report.companyAdminName,
      companyAdminGender: report.companyAdminGender,
      contactName: report.contactName,
      contactEmail: report.contactEmail,

      salaryDataPeriod: report.salaryDataPeriod ?? null,
      salaryDataBasis: report.salaryDataBasis ?? null,
      counts: gap?.counts ?? null,
      meanHourlyWageMale: gap?.meanHourlyWageMale ?? null,
      meanHourlyWageFemale: gap?.meanHourlyWageFemale ?? null,
      rawGapPercent: gap?.rawGapPercent ?? null,
      rawGapDirection: gap?.rawGapDirection ?? null,
      oskyrtPercent: gap?.oskyrtPercent ?? null,
      oskyrtDirection: gap?.oskyrtDirection ?? null,
      benchmarkPercent: toNumber(result?.salaryDifferenceThresholdPercent),
      // Carried through as the server computed it — see the field's docblock.
      oskyrtWithinBenchmark: gap?.oskyrtWithinBenchmark ?? null,
      minimumSetSize: gap?.minimumSetSize ?? null,
      calculationVersion: result?.calculationVersion ?? null,
    }
  }
}
