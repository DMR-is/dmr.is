/**
 * Admin-side read service for salary + equality reports.
 *
 * Responsibilities:
 * - `list(query)`: paginated list with enum/date/reviewer filters, free-text
 *   across company and contact fields, and sort.
 * - `getById(id)`: full detail including company snapshot, comments, and a
 *   reference to the paired equality report (if any).
 *
 * Writes are explicitly out of scope — report creation / status transitions /
 * reviewer assignment live on the submission + admin-action flows, handled
 * by other modules. This service never mutates report data.
 */

import { Op, Order, WhereOptions } from 'sequelize'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  generatePaging,
  getLimitAndOffset,
} from '@dmr.is/utils-server/serverUtils'

import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportRoleResultModel } from '../report-result/models/report-role-result.model'
import { EqualityReportDto } from './dto/equality-report.dto'
import { EqualityReportSummaryDto } from './dto/equality-report-summary.dto'
import {
  GetReportsQueryDto,
  SortDirectionEnum,
} from './dto/get-reports.query.dto'
import {
  GetReportsResponseDto,
  ReportStatusCountsDto,
} from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'
import {
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
} from './dto/report-timeline-item.dto'
import { ReportStatusEnum, ReportTypeEnum } from './models/report.enums'
import { ReportModel } from './models/report.model'
import { ReportCommentModel } from './models/report-comment.model'
import { ReportEventModel } from './models/report-event.model'
import { buildFreeTextWhere, dateRangeFilter } from './utils/filters'
import { IReportService } from './report.service.interface'

const LOGGING_CONTEXT = 'ReportService'

/**
 * Default sort. Newest reports first — admins nearly always want to see the
 * latest submissions at the top of the list. Overridable via `?sortBy=&direction=`.
 */
const DEFAULT_SORT: Order = [['createdAt', 'DESC']]

@Injectable()
export class ReportService implements IReportService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel) private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
    @InjectModel(ReportRoleResultModel)
    private readonly reportRoleResultModel: typeof ReportRoleResultModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
  ) {}

  async list(query: GetReportsQueryDto): Promise<GetReportsResponseDto> {
    this.logger.debug('Listing reports', {
      context: LOGGING_CONTEXT,
      filters: Object.entries(query as unknown as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k]) => k),
    })

    const where = this.buildWhere(query)
    const order = this.buildOrder(query)
    const { limit, offset } = getLimitAndOffset(query)

    // For tab counts: apply all filters except status so each group count
    // reflects the user's active search/filter state regardless of active tab.
    const whereForCounts = this.buildWhere({ ...query, status: undefined })
    const countCol = `${ReportModel.name}.id`

    const [{ rows, count }, submittedCount, inReviewCount, processedCount] =
      await Promise.all([
        this.reportModel.scope('listview').findAndCountAll({
          where,
          order,
          limit,
          offset,
          // distinct + col avoids row duplication from the include inflating count.
          // Qualify with the model alias — the listview scope joins tables that
          // also have an `id` column, so a bare `id` is ambiguous in Postgres.
          distinct: true,
          col: countCol,
          // Subquery off so the nested-where syntax works against joined cols.
          subQuery: false,
        }),
        this.reportModel.scope('listview').count({
          where: { ...whereForCounts, status: ReportStatusEnum.SUBMITTED },
          distinct: true,
          col: countCol,
        }),
        this.reportModel.scope('listview').count({
          where: { ...whereForCounts, status: ReportStatusEnum.IN_REVIEW },
          distinct: true,
          col: countCol,
        }),
        this.reportModel.scope('listview').count({
          where: {
            ...whereForCounts,
            status: {
              [Op.in]: [
                ReportStatusEnum.APPROVED,
                ReportStatusEnum.DENIED,
                ReportStatusEnum.SUPERSEDED,
              ],
            },
          },
          distinct: true,
          col: countCol,
        }),
      ])

    const reports = rows.map((r) => r.fromModelToListItem())
    const paging = generatePaging(reports, query.page, query.pageSize, count)

    const statusCounts: ReportStatusCountsDto = {
      submitted: submittedCount,
      inReview: inReviewCount,
      processed: processedCount,
    }

    return { reports, paging, statusCounts }
  }

  async getById(id: string): Promise<ReportDetailDto> {
    this.logger.debug('Fetching report detail', {
      context: LOGGING_CONTEXT,
      id,
    })

    // `withScope` (not `scope`) preserves the `findByPkOrThrow` extension
    // added by BaseModel — plain `scope()` returns a ModelCtor that strips
    // the static augmentations.
    const report = await this.reportModel
      .withScope('detailed')
      .findByPkOrThrow(id)

    const base = report.fromModel()
    const equalityReport = await this.resolveEqualityReport(report)

    // `required: true` on the include above guarantees companyReport is
    // present — if this throws, the DB has a report without a snapshot,
    // which is invariant-breaking and deserves a loud error.
    if (!report.companyReport) {
      this.logger.error(
        'Report has no companyReport snapshot — data integrity violation',
        {
          context: LOGGING_CONTEXT,
          category: 'getById',
          reportId: report.id,
          reportType: report.type,
          reportStatus: report.status,
          reportIdentifier: report.identifier,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      )
      throw new InternalServerErrorException(
        `Report ${report.id} has no companyReport snapshot — data integrity issue`,
      )
    }

    const [{ result, roleResults, employeeOutliers }, timeline] =
      await Promise.all([
        this.loadSalaryCalculations(report),
        this.buildTimeline(id, report.comments ?? []),
      ])

    return {
      ...base,
      company: CompanyReportModel.fromModel(report.companyReport),
      equalityReport,
      timeline,
      result,
      roleResults,
      employeeOutliers,
    }
  }

  /**
   * Find the company's currently-active EQUALITY report. "Active" means
   * APPROVED with a `valid_until` strictly in the future. Prefer the most
   * recently approved report if more than one active row exists.
   *
   * Returns null when there's no active equality — callers translate that
   * into a 404 at the API surface.
   */
  async getActiveEqualityForCompany(
    companyId: string,
  ): Promise<EqualityReportSummaryDto | null> {
    const report = await this.reportModel.findOne({
      where: {
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
        validUntil: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: CompanyReportModel,
          as: 'companyReport',
          where: { companyId },
          required: true,
          attributes: [],
        },
      ],
      order: [['approvedAt', 'DESC']],
    })

    if (!report) {
      return null
    }

    return {
      id: report.id,
      identifier: report.identifier,
      approvedAt: report.approvedAt,
      validUntil: report.validUntil,
    }
  }

  private async buildTimeline(
    reportId: string,
    comments: ReportCommentModel[],
  ): Promise<ReportTimelineItemDto[]> {
    const events = await this.reportEventModel.findAll({
      where: { reportId },
      order: [['createdAt', 'ASC']],
    })

    const eventItems: ReportTimelineItemDto[] = events.map((e) => ({
      kind: ReportTimelineItemKindEnum.EVENT,
      createdAt: e.createdAt,
      event: ReportEventModel.fromModel(e),
      comment: null,
    }))

    const commentItems: ReportTimelineItemDto[] = comments.map((c) => ({
      kind: ReportTimelineItemKindEnum.COMMENT,
      createdAt: c.createdAt,
      event: null,
      comment: ReportCommentModel.fromModel(c),
    }))

    return [...eventItems, ...commentItems].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )
  }

  /**
   * Load salary calculation outputs for a report. Returns empty/null
   * everything for non-salary reports and for salary reports where the
   * scoring engine has not run yet.
   *
   * Kept as sequential `findAll` queries rather than nested includes so the
   * report-result / report-employee modules (owned by teammates) don't need
   * to declare reverse-side associations for this module's benefit.
   */
  private async loadSalaryCalculations(report: ReportModel): Promise<{
    result: ReportDetailDto['result']
    roleResults: ReportDetailDto['roleResults']
    employeeOutliers: ReportDetailDto['employeeOutliers']
  }> {
    if (report.type !== ReportTypeEnum.SALARY || !report.result) {
      return { result: null, roleResults: [], employeeOutliers: [] }
    }

    const [roleResultRows, outlierRows] = await Promise.all([
      this.reportRoleResultModel.findAll({
        where: { reportResultId: report.result.id },
      }),
      this.reportEmployeeOutlierModel.findAll({
        include: [
          {
            model: ReportEmployeeModel,
            as: 'reportEmployee',
            attributes: [],
            where: { reportId: report.id },
            required: true,
          },
        ],
      }),
    ])

    return {
      result: report.result.fromModel(),
      roleResults: roleResultRows.map((r) => r.fromModel()),
      employeeOutliers: outlierRows.map((d) => d.fromModel()),
    }
  }

  /**
   * Build the Sequelize `where` clause from the query DTO. Each filter
   * dimension is independent — they compose with implicit AND.
   */
  private buildWhere(query: GetReportsQueryDto): WhereOptions {
    const where: WhereOptions = {}

    if (query.type?.length) {
      Object.assign(where, { type: { [Op.in]: query.type } })
    }
    if (query.status?.length) {
      Object.assign(where, { status: { [Op.in]: query.status } })
    }

    // `unassignedReviewer` deliberately overrides `reviewerUserId` — the
    // workflow question "what needs me to pick up" is the more common one.
    if (query.unassignedReviewer) {
      Object.assign(where, { reviewerUserId: { [Op.is]: null } })
    } else if (query.reviewerUserId?.length) {
      Object.assign(where, {
        reviewerUserId: { [Op.in]: query.reviewerUserId },
      })
    }

    const created = dateRangeFilter(query.createdFrom, query.createdTo)
    if (created) Object.assign(where, { createdAt: created })

    const approved = dateRangeFilter(query.approvedFrom, query.approvedTo)
    if (approved) Object.assign(where, { approvedAt: approved })

    const validUntil = dateRangeFilter(query.validUntilFrom, query.validUntilTo)
    if (validUntil) Object.assign(where, { validUntil })

    const correction = dateRangeFilter(
      query.correctionDeadlineFrom,
      query.correctionDeadlineTo,
    )
    if (correction) Object.assign(where, { correctionDeadline: correction })

    if (query.q?.trim()) {
      Object.assign(where, buildFreeTextWhere(query.q))
    }

    return where
  }

  /**
   * Map the sort DTO to Sequelize's `order` tuple. Only known columns are
   * allowed (enum-gated) — prevents SQL injection via sort field, and means
   * we only expose columns that make sense for admin workflows.
   */
  private buildOrder(query: GetReportsQueryDto): Order {
    if (!query.sortBy) return DEFAULT_SORT
    const direction = query.direction === SortDirectionEnum.ASC ? 'ASC' : 'DESC'
    return [[query.sortBy, direction]]
  }

  /**
   * Collapse the equality-content resolution into one place so the caller
   * doesn't branch on report type. The domain rule "every report has an
   * equality report" is enforced here:
   *
   * - EQUALITY report     → mirror its own fields into the equality block.
   * - SALARY report       → load the linked equality via `equalityReportId`
   *                         and project its fields. Missing link on salary
   *                         = data-integrity error, throw loud.
   *
   * The field projection lives on the model as
   * `ReportModel.fromModelToEqualityReport` — this method just decides
   * *which* report to project from.
   */
  private async resolveEqualityReport(
    report: ReportModel,
  ): Promise<EqualityReportDto> {
    if (report.type === ReportTypeEnum.EQUALITY) {
      return ReportModel.fromModelToEqualityReport(report)
    }

    if (!report.equalityReportId) {
      this.logger.error(
        'Salary report has no linked equality report — data integrity violation',
        {
          context: LOGGING_CONTEXT,
          category: 'resolveEqualityReport',
          reportId: report.id,
          reportType: report.type,
          reportStatus: report.status,
          reportIdentifier: report.identifier,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      )
      throw new InternalServerErrorException(
        `Salary report ${report.id} has no linked equality report — data integrity issue`,
      )
    }

    const equality = await this.reportModel.findByPk(report.equalityReportId, {
      attributes: [
        'id',
        'identifier',
        'status',
        'equalityReportContent',
        'approvedAt',
        'validUntil',
        'correctionDeadline',
      ],
    })

    if (!equality) {
      this.logger.error(
        'Salary report references non-existent equality report — data integrity violation (dangling FK)',
        {
          context: LOGGING_CONTEXT,
          category: 'resolveEqualityReport',
          reportId: report.id,
          reportType: report.type,
          reportStatus: report.status,
          reportIdentifier: report.identifier,
          danglingEqualityReportId: report.equalityReportId,
        },
      )
      throw new InternalServerErrorException(
        `Salary report ${report.id} references equality report ${report.equalityReportId} which does not exist — data integrity issue`,
      )
    }

    return equality.fromModelToEqualityReport()
  }
}
