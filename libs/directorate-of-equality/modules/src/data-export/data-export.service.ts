import { Op } from 'sequelize'

import { Inject, Injectable, PayloadTooLargeException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../company/company.service.interface'
import { GetCompaniesQueryDto } from '../company/dto/get-companies-query.dto'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IsatSectionModel } from '../company/models/isat-section.model'
import { PostcodeModel } from '../location/models/postcode.model'
import { RegionModel } from '../location/models/region.model'
import { ReportStatusEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import type { DataExportFileDto } from './dto/data-export.dto'
import { COMPANY_EXPORT_COLUMNS, type ExportColumn } from './lib/columns'
import type { CompanyEmployeeCounts, CompanyExportRow } from './lib/rows'
import { type ExportMetadata, writeXlsx, XLSX_MIME } from './lib/writer'
import { IDataExportService } from './data-export.service.interface'

const LOGGING_CONTEXT = 'DataExportService'

/**
 * Hard ceiling on an export, well above anything the register can produce
 * today (~1 800 companies).
 *
 * It exists so a filter that accidentally matches everything fails loudly
 * instead of building a multi-hundred-megabyte workbook in memory and taking
 * the API down with it. If this is ever hit legitimately, the fix is streaming,
 * not a bigger number.
 */
const MAX_EXPORT_ROWS = 10_000

/** Location lookup, keyed by `postcode.id`. */
type LocationLookup = Map<
  string,
  { code: string; place: string; region: string | null }
>

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
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(PostcodeModel)
    private readonly postcodeModel: typeof PostcodeModel,
    @InjectModel(IsatSectionModel)
    private readonly isatSectionModel: typeof IsatSectionModel,
  ) {}

  async exportCompanies(
    query: GetCompaniesQueryDto,
    filterSummary: string[],
    actorUserId: string,
  ): Promise<DataExportFileDto> {
    // The same read the register list runs, unpaged — see `findAllByFilter`.
    const companies = await this.companyService.findAllByFilter(query)
    this.assertWithinLimit(companies.length, actorUserId)

    const [locations, isatSections, employeeCounts] = await Promise.all([
      this.loadLocations(),
      this.loadIsatSections(),
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
        isatSectionDescription: company.isatCategory
          ? (isatSections.get(company.isatCategory.section) ?? null)
          : null,
        employeeCounts: employeeCounts.get(company.id) ?? null,
      }
    })

    return this.render(
      rows,
      COMPANY_EXPORT_COLUMNS,
      'Fyrirtæki',
      filterSummary,
      actorUserId,
    )
  }

  // -------------------------------------------------------------------------

  private assertWithinLimit(rowCount: number, actorUserId: string): void {
    if (rowCount <= MAX_EXPORT_ROWS) return

    this.logger.warn(
      `Refusing export of ${rowCount} rows (limit ${MAX_EXPORT_ROWS})`,
      { context: LOGGING_CONTEXT, rowCount, actorUserId },
    )
    throw new PayloadTooLargeException(
      `Útdrátturinn nær til ${rowCount} raða, sem er yfir hámarkinu (${MAX_EXPORT_ROWS}). Þrengdu síurnar.`,
    )
  }

  private async render<TRow>(
    rows: TRow[],
    columns: ExportColumn<TRow>[],
    title: string,
    filterSummary: string[],
    actorUserId: string,
  ): Promise<DataExportFileDto> {
    const generatedAt = new Date()
    const stamp = generatedAt.toISOString().slice(0, 10)

    this.logger.info(`Exporting ${rows.length} ${title} rows`, {
      context: LOGGING_CONTEXT,
      rowCount: rows.length,
      // Who took the kennitölur and pay-gap figures out of the system.
      actorUserId,
    })

    const metadata: ExportMetadata = {
      title,
      generatedAt,
      rowCount: rows.length,
      filters: filterSummary,
    }

    return {
      fileName: `jafnrettisstofa-${title.toLowerCase()}-${stamp}.xlsx`,
      contentType: XLSX_MIME,
      content: await writeXlsx(rows, columns, metadata),
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

  /** The ÍSAT section names, keyed by section code. Same reasoning as `loadLocations`. */
  private async loadIsatSections(): Promise<Map<string, string>> {
    const rows = await this.isatSectionModel.findAll({
      attributes: ['code', 'description'],
    })

    return new Map(rows.map((row) => [row.code, row.description]))
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
        total: parts.length ? parts.reduce((sum, part) => sum + part, 0) : null,
        reportedAt: report.approvedAt ?? null,
      })
    }

    return counts
  }
}
