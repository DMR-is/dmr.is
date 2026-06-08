import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportTypeEnum } from '../report/models/report.enums'
import { IReportService } from '../report/report.service.interface'
import { ReportEmployeeOutlierDto } from '../report-employee/dto/report-employee-outlier.dto'
import { IReportStatisticsService } from '../report-statistics/report-statistics.service.interface'
import { getBrowser } from './lib/browser'
import { buildEqualityReportHtml } from './lib/equality-report-template'
import { pdfStyles } from './lib/pdf.css'
import { buildSalaryReportHtml } from './lib/salary-report-template'
import { IReportPdfService } from './report-pdf.service.interface'

const LOGGING_CONTEXT = 'ReportPdfService'
const OUTLIER_PAGE_SIZE = 200

@Injectable()
export class ReportPdfService implements IReportPdfService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportService) private readonly reportService: IReportService,
    @Inject(IReportStatisticsService)
    private readonly reportStatisticsService: IReportStatisticsService,
  ) {}

  async generateSalaryReportPdf(reportId: string): Promise<Buffer> {
    this.logger.debug('Generating salary report PDF', {
      context: LOGGING_CONTEXT,
      reportId,
    })

    const report = await this.reportService.getById(reportId)

    if (report.type !== ReportTypeEnum.SALARY) {
      throw new BadRequestException(
        `Report "${reportId}" is not a salary report`,
      )
    }

    const [statistics, outliers] = await Promise.all([
      this.reportStatisticsService.getBaseSalaryByGenderAndScoreAll(reportId),
      this.fetchAllOutliers(reportId),
    ])

    const html = buildSalaryReportHtml({ report, statistics, outliers })

    return this.generatePdfFromHtml(html)
  }

  async generateEqualityReportPdf(reportId: string): Promise<Buffer> {
    this.logger.debug('Generating equality report PDF', {
      context: LOGGING_CONTEXT,
      reportId,
    })

    const report = await this.reportService.getById(reportId)

    const html = buildEqualityReportHtml(report)

    return this.generatePdfFromHtml(html)
  }

  /** Pages through `IReportService.getOutliers` to collect every row. */
  private async fetchAllOutliers(
    reportId: string,
  ): Promise<ReportEmployeeOutlierDto[]> {
    const collected: ReportEmployeeOutlierDto[] = []
    let page = 1

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { outliers, paging } = await this.reportService.getOutliers(
        reportId,
        { page, pageSize: OUTLIER_PAGE_SIZE },
      )

      collected.push(...outliers)

      if (collected.length >= paging.totalItems || outliers.length === 0) {
        break
      }

      page += 1
    }

    return collected
  }

  private async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await getBrowser()
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      await page.addStyleTag({ content: pdfStyles })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      })

      return Buffer.from(pdfBuffer)
    } catch (error) {
      this.logger.warn('Failed to generate report PDF', {
        context: LOGGING_CONTEXT,
        error,
      })
      throw error
    } finally {
      await browser.close()
    }
  }
}
