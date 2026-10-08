import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IPdfRenderService } from '../pdf-render/pdf-render.service.interface'
import { ReportDetailDto } from '../report/dto/report-detail.dto'
import {
  EqualityContentTypeEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { IReportService } from '../report/report.service.interface'
import { ReportEmployeeOutlierDto } from '../report-employee/dto/report-employee-outlier.dto'
import { IReportStatisticsService } from '../report-statistics/report-statistics.service.interface'
import { buildEqualityReportHtml } from './lib/equality-report-template'
import {
  buildImprovementPlanHtml,
  ImprovementPlanGroup,
} from './lib/improvement-plan-template'
import { mergePdfs } from './lib/merge'
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
    @Inject(IPdfRenderService)
    private readonly pdfRenderService: IPdfRenderService,
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

    /*
     * No groups means no plan to state. Returning null rather than a document
     * whose only content is "engir hópar" — see the interface note.
     *
     * Reachable only for a report with no outliers at all: `group_id` is a NOT
     * NULL FK on every outlier row, so groups exist whenever outliers do. That is
     * what lets the salary report's Úrbótaáætlun section assert the separate
     * document exists whenever it renders a non-zero count.
     */
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
     * The úrbótaáætlun could not live in the salary report because
     * `improvementPlanSection` renders `fetchAllOutliers` — one flat table, no
     * group name, ástæða, aðgerð or signature. That was the section's shape, not
     * a limit of the data: `ReportEmployeeOutlierDto` denormalises `groupId`,
     * `groupName`, `reason`, `action`, `signatureName`, `signatureRole` and
     * `remedyDate` onto every row, so **a single unfiltered pass bucketed by
     * `row.groupId` would produce identical output** and is the fix for the N+1
     * below. Do not read this loop as evidence that per-group queries are
     * required.
     *
     * ⚠️ It is an N+1, and the group count is applicant-defined and uncapped:
     * each call re-runs the `detailed` scope and its per-employee snapshot
     * (`report.service.ts`), G×P times, in the most heap-constrained path there
     * is. Scoped out of this PR with the durable-record work, not defended.
     *
     * Sequential rather than `Promise.all` in the meantime: a report with many
     * groups would otherwise open a connection per group against the same pool
     * this request is already holding.
     */
    const planGroups: ImprovementPlanGroup[] = []
    for (const group of groups) {
      planGroups.push({
        group,
        members: await this.fetchAllOutliers(reportId, group.id),
      })
    }

    /*
     * ⚠️ Gate on MEMBERS, not just on group count. Groups existing with nothing
     * assigned is the state `improvement-plan-template.ts` itself calls a data
     * fault; attaching a document that reads "Engir starfsmenn skráðir í þennan
     * hóp" beside a salary report rendering its "Engar úrbætur nauðsynlegar"
     * branch tells the company two different things in one email.
     */
    /*
     * ⚠️ Filter, not `every`. The gate used to fire only when EVERY group was
     * empty, so a single group emptied — `pruneStaleMemberships` can do that —
     * still shipped a document reading "Engir starfsmenn skráðir í þennan hóp"
     * next to two perfectly good groups.
     *
     * Dropping the empty ones keeps the groups that do describe something, and
     * `null` is reserved for there being nothing to describe at all.
     */
    const populated = planGroups.filter((entry) => entry.members.length > 0)

    if (populated.length === 0) {
      this.logger.warn(
        'Outlier groups exist but none has members; skipping improvement plan PDF',
        { context: LOGGING_CONTEXT, reportId, groupCount: planGroups.length },
      )
      return null
    }

    if (populated.length < planGroups.length) {
      this.logger.warn(
        'Omitting outlier groups with no members from the improvement plan PDF',
        {
          context: LOGGING_CONTEXT,
          reportId,
          omitted: planGroups.length - populated.length,
          rendered: populated.length,
        },
      )
    }

    const html = buildImprovementPlanHtml({ report, groups: populated })

    return {
      pdf: await this.renderPdf(html),
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

    return this.renderPdf(html)
  }

  private async buildEqualityReportPdf(
    report: ReportDetailDto,
  ): Promise<Buffer> {
    // HTML content: one render, exactly as before the PDF path existed.
    if (report.equalityReport?.contentType !== EqualityContentTypeEnum.PDF) {
      return this.renderPdf(buildEqualityReportHtml(report))
    }

    /*
     * PDF content: the same template rendered without its body becomes a cover
     * page, and the company's own document follows it. The metadata (auðkenni,
     * samþykkt, gildir til, frestur til úrbóta) is the part that makes this an
     * approved report rather than just a file someone sent us, so it stays on
     * the document regardless of which representation the content took.
     *
     * `equalityReport.id` rather than `report.id`: on a SALARY report this
     * block is the LINKED equality report, and its content lives on that row.
     */
    const [cover, uploaded] = await Promise.all([
      this.renderPdf(buildEqualityReportHtml(report, { includeBody: false })),
      this.reportService.getEqualityContentPdf(report.equalityReport.id),
    ])

    return mergePdfs([cover, uploaded.pdf])
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

  private renderPdf(html: string): Promise<Buffer> {
    return this.pdfRenderService.renderHtml(html, pdfStyles)
  }
}
