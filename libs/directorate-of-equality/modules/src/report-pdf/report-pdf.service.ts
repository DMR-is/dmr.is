import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportDetailDto } from '../report/dto/report-detail.dto'
import { ReportTypeEnum } from '../report/models/report.enums'
import { IReportService } from '../report/report.service.interface'
import { ReportEmployeeOutlierDto } from '../report-employee/dto/report-employee-outlier.dto'
import { IReportStatisticsService } from '../report-statistics/report-statistics.service.interface'
import { getBrowser } from './lib/browser'
import { buildEqualityReportHtml } from './lib/equality-report-template'
import {
  buildImprovementPlanHtml,
  ImprovementPlanGroup,
} from './lib/improvement-plan-template'
import { pdfStyles } from './lib/pdf.css'
import { buildSalaryReportHtml } from './lib/salary-report-template'
import {
  IReportPdfService,
  ReportPdfResult,
} from './report-pdf.service.interface'

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

  async generateReportPdf(reportId: string): Promise<ReportPdfResult> {
    this.logger.debug('Generating report PDF', {
      context: LOGGING_CONTEXT,
      reportId,
    })

    const report = await this.reportService.getById(reportId)

    switch (report.type) {
      case ReportTypeEnum.SALARY:
        return {
          pdf: await this.buildSalaryReportPdf(report),
          fileName: `launagreining-${reportId}.pdf`,
        }
      case ReportTypeEnum.EQUALITY:
        return {
          pdf: await this.buildEqualityReportPdf(report),
          fileName: `jafnrettisaaetlun-${reportId}.pdf`,
        }
      default:
        throw new BadRequestException(
          `Report "${reportId}" has an unsupported type "${report.type}"`,
        )
    }
  }

  async generateImprovementPlanPdf(
    reportId: string,
  ): Promise<ReportPdfResult | null> {
    this.logger.debug('Generating improvement plan PDF', {
      context: LOGGING_CONTEXT,
      reportId,
    })

    const report = await this.reportService.getById(reportId)

    if (report.type !== ReportTypeEnum.SALARY) {
      throw new BadRequestException(
        `Report "${reportId}" is not a salary report and has no improvement plan`,
      )
    }

    const { groups } = await this.reportService.getOutlierGroups(reportId)

    // No groups means no plan to state. Returning null rather than a document
    // whose only content is "engir hópar" — see the interface note.
    if (groups.length === 0) {
      this.logger.debug('No outlier groups; skipping improvement plan PDF', {
        context: LOGGING_CONTEXT,
        reportId,
      })
      return null
    }

    /*
     * One `getOutliers` call per group, with `groupId` set.
     *
     * ⚠️ This is the whole reason the úrbótaáætlun could not live in the salary
     * report: `fetchAllOutliers` pages `getOutliers` WITHOUT a `groupId`, so
     * every group collapsed into one flat table and the group name, ástæða,
     * aðgerð and signature had nowhere to go.
     *
     * Sequential rather than `Promise.all`: a report with many groups would
     * otherwise open a connection per group against the same pool this request
     * is already holding, and the page count here is small.
     */
    const planGroups: ImprovementPlanGroup[] = []
    for (const group of groups) {
      planGroups.push({
        group,
        members: await this.fetchAllOutliers(reportId, group.id),
      })
    }

    const html = buildImprovementPlanHtml({ report, groups: planGroups })

    return {
      pdf: await this.generatePdfFromHtml(html),
      fileName: `urbotaaetlun-${reportId}.pdf`,
    }
  }

  private async buildSalaryReportPdf(report: ReportDetailDto): Promise<Buffer> {
    // `payComponents` is its own call for the same reason the admin screen
    // fetches it separately: these are monthly krónur, not rates, so they are
    // not part of the chart payload.
    const [statistics, outliers, payComponents] = await Promise.all([
      this.reportStatisticsService.getRegularHourlyWageByScoreAll(report.id),
      this.fetchAllOutliers(report.id),
      this.reportStatisticsService.getBenefitsBreakdown(report.id),
    ])

    const html = buildSalaryReportHtml({
      report,
      statistics,
      outliers,
      payComponents,
    })

    return this.generatePdfFromHtml(html)
  }

  private async buildEqualityReportPdf(
    report: ReportDetailDto,
  ): Promise<Buffer> {
    const html = buildEqualityReportHtml(report)

    return this.generatePdfFromHtml(html)
  }

  /**
   * Pages through `IReportService.getOutliers` to collect every row, optionally
   * restricted to one group.
   */
  private async fetchAllOutliers(
    reportId: string,
    groupId?: string,
  ): Promise<ReportEmployeeOutlierDto[]> {
    const collected: ReportEmployeeOutlierDto[] = []
    let page = 1

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { outliers, paging } = await this.reportService.getOutliers(
        reportId,
        { page, pageSize: OUTLIER_PAGE_SIZE, groupId },
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
      /*
       * ⚠️ `load`, NOT `networkidle0`.
       *
       * These documents are self-contained: the chart is inline SVG, the styles
       * are injected below, and there is no image, font or script fetched from
       * anywhere. So there is no network to go idle, and `networkidle0` waits for
       * a 500ms silent window that some Chromium builds never report for such a
       * page — it then fails the whole render with `Navigation timeout of 30000
       * ms exceeded`. Verified locally: `networkidle0` and `networkidle2` both
       * time out against `/Applications/Chromium.app`, while `load`,
       * `domcontentloaded` and the default all finish in ~1.5s and produce a
       * BYTE-IDENTICAL PDF. Waiting for network idle buys this renderer nothing.
       *
       * The stake is higher than a failed download: `notifyCompanyApproved`
       * renders inside the reviewer's approve request and swallows failures, so a
       * hang here costs 30s per document and ends with the company never being
       * told its report was approved.
       *
       * The other PDF services in this repo (`legal-gazette-api`,
       * `official-journal`) still pass `networkidle0`. They work in the deployed
       * container, so its `/usr/bin/chromium-browser` does settle — but the same
       * latent hang is one Chromium bump away for them. Not changed here.
       */
      await page.setContent(html, { waitUntil: 'load' })
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
