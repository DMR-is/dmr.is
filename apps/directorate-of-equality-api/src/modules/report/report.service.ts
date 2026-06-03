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

import { col, fn, Op, Order, WhereOptions } from 'sequelize'

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
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportRoleResultModel } from '../report-result/models/report-role-result.model'
import { UserModel } from '../user/models/user.model'
import { EqualityReportDto } from './dto/equality-report.dto'
import { EqualityReportSummaryDto } from './dto/equality-report-summary.dto'
import {
  GetReportOutliersQueryDto,
  ReportOutlierSortByEnum,
} from './dto/get-report-outliers.query.dto'
import {
  GetReportsQueryDto,
  SortDirectionEnum,
} from './dto/get-reports.query.dto'
import {
  GetReportsResponseDto,
  ReportStatusCountsDto,
} from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'
import { ReportOverviewDto } from './dto/report-overview.dto'
import {
  ReportOverviewStatisticsDto,
  ReportStatisticsItemDto,
  ReportStatisticsWindowDto,
} from './dto/report-overview-statistics.dto'
import {
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
} from './dto/report-timeline-item.dto'
import { ReportStatusEnum, ReportTypeEnum } from './models/report.enums'
import { ReportModel } from './models/report.model'
import { ReportEventModel } from './models/report-event.model'
import { ReportRoleEnum } from './types/report-resource-context'
import {
  buildFreeTextWhere,
  buildImprovementPlanWhere,
  dateRangeFilter,
} from './utils/filters'
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
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(ReportCommentModel)
    private readonly reportCommentModel: typeof ReportCommentModel,
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

    const [
      { rows, count },
      submittedCount,
      inReviewCount,
      processedCount,
      postponedCount,
    ] = await Promise.all([
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
      this.reportModel.scope('listview').count({
        where: { ...whereForCounts, status: ReportStatusEnum.POSTPONED },
        distinct: true,
        col: countCol,
      }),
    ])

    const pageIds = rows.map((r) => r.id)
    const [waitingMap, improvementPlanMap] = await Promise.all([
      this.computeWaitingForAction(pageIds),
      this.computeIncludesImprovementPlan(pageIds),
    ])
    const reports = rows.map((r) =>
      r.fromModelToListItem(
        waitingMap.get(r.id) ?? false,
        improvementPlanMap.get(r.id) ?? false,
      ),
    )
    const paging = generatePaging(reports, query.page, query.pageSize, count)

    const statusCounts: ReportStatusCountsDto = {
      submitted: submittedCount,
      inReview: inReviewCount,
      processed: processedCount,
      postponed: postponedCount,
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

    const [
      { result, roleResults, includesImprovementPlan },
      timeline,
      subsidiaries,
    ] = await Promise.all([
      this.loadSalaryCalculations(report),
      this.buildTimeline(id, report.comments ?? []),
      this.loadSubsidiaries(id),
    ])

    return {
      ...base,
      company: CompanyReportModel.fromModel(report.companyReport),
      subsidiaries,
      equalityReport,
      timeline,
      result,
      roleResults,
      includesImprovementPlan,
    }
  }

  /**
   * Per-page boolean: true when the most recent timeline item (event OR
   * comment, whichever is newer) is a COMPANY-authored comment — i.e. the
   * applicant has said something and no reviewer action/comment has come
   * after it. Computed via two MAX(createdAt) GROUP BY queries scoped to the
   * page's report IDs, then compared in JS — bounded by pageSize, no N+1.
   */
  private async computeWaitingForAction(
    reportIds: string[],
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>()
    if (reportIds.length === 0) return result

    const [latestEvents, latestCompanyComments] = await Promise.all([
      this.reportEventModel.findAll({
        where: { reportId: { [Op.in]: reportIds } },
        attributes: ['reportId', [fn('MAX', col('created_at')), 'latestAt']],
        group: ['reportId'],
        raw: true,
      }) as unknown as Promise<{ reportId: string; latestAt: Date }[]>,
      this.reportCommentModel.findAll({
        where: {
          reportId: { [Op.in]: reportIds },
          authorKind: ReportRoleEnum.COMPANY,
        },
        attributes: ['reportId', [fn('MAX', col('created_at')), 'latestAt']],
        group: ['reportId'],
        raw: true,
      }) as unknown as Promise<{ reportId: string; latestAt: Date }[]>,
    ])

    const eventMap = new Map(
      latestEvents.map((e) => [e.reportId, new Date(e.latestAt).getTime()]),
    )
    const commentMap = new Map(
      latestCompanyComments.map((c) => [
        c.reportId,
        new Date(c.latestAt).getTime(),
      ]),
    )

    for (const reportId of reportIds) {
      const eventAt = eventMap.get(reportId)
      const commentAt = commentMap.get(reportId)
      if (commentAt === undefined) {
        result.set(reportId, false)
      } else if (eventAt === undefined) {
        result.set(reportId, true)
      } else {
        result.set(reportId, commentAt > eventAt)
      }
    }

    return result
  }

  /**
   * Per-page boolean: true when the report has at least one employee outlier.
   * Outliers are owned by `ReportEmployeeOutlierModel` and link to the report
   * via `ReportEmployeeModel.reportId`. One grouped query scoped to the
   * page's report IDs — bounded by pageSize, no N+1.
   */
  private async computeIncludesImprovementPlan(
    reportIds: string[],
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>()
    if (reportIds.length === 0) return result
    for (const id of reportIds) result.set(id, false)

    const rows = (await this.reportEmployeeOutlierModel.findAll({
      include: [
        {
          model: ReportEmployeeModel,
          as: 'reportEmployee',
          attributes: [],
          where: { reportId: { [Op.in]: reportIds } },
          required: true,
        },
      ],
      attributes: [[col('reportEmployee.report_id'), 'reportId']],
      group: [col('reportEmployee.report_id')],
      raw: true,
    })) as unknown as { reportId: string }[]

    for (const row of rows) result.set(row.reportId, true)
    return result
  }

  /**
   * Subsidiary snapshots for the report — every `company_report` row whose
   * `parentCompanyId` is non-null. The parent row is excluded (it's already
   * returned as `company`). Result is sorted by name for stable UI display.
   */
  private async loadSubsidiaries(reportId: string) {
    const rows = await this.companyReportModel.findAll({
      where: { reportId, parentCompanyId: { [Op.not]: null } },
      order: [['name', 'ASC']],
    })
    return rows.map((row) => row.fromModel())
  }

  async getOverview(nationalId: string): Promise<ReportOverviewDto> {
    this.logger.debug('Fetching report overview', {
      context: LOGGING_CONTEXT,
      nationalId,
    })

    const activeStatuses = [
      ReportStatusEnum.SUBMITTED,
      ReportStatusEnum.IN_REVIEW,
    ]

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setUTCHours(23, 59, 59, 999)

    const reviewerInclude = {
      model: UserModel,
      as: 'reviewer',
      required: true,
      attributes: [],
      where: { nationalId },
    }

    const [
      submittedToday,
      inProgress,
      reportsWithComments,
      reportsWithoutEmployee,
      totalAssigned,
      assignedWithComments,
    ] = await Promise.all([
      this.reportModel.count({
        where: {
          status: ReportStatusEnum.SUBMITTED,
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        },
      }),
      this.reportModel.count({
        where: { status: ReportStatusEnum.IN_REVIEW },
      }),
      this.reportModel.count({
        where: { status: { [Op.in]: activeStatuses } },
        include: [
          {
            model: ReportCommentModel,
            as: 'comments',
            required: true,
            attributes: [],
          },
        ],
        distinct: true,
      }),
      this.reportModel.count({
        where: {
          status: { [Op.in]: activeStatuses },
          reviewerUserId: { [Op.is]: null },
        },
      }),
      this.reportModel.count({
        where: { status: { [Op.in]: activeStatuses } },
        include: [reviewerInclude],
        distinct: true,
      }),
      this.reportModel.count({
        where: { status: { [Op.in]: activeStatuses } },
        include: [
          reviewerInclude,
          {
            model: ReportCommentModel,
            as: 'comments',
            required: true,
            attributes: [],
          },
        ],
        distinct: true,
      }),
    ])

    return {
      general: {
        submittedToday,
        inProgress,
        reportsWithComments,
        reportsWithoutEmployee,
      },
      assigned: { totalAssigned, assignedWithComments },
    }
  }

  async getOverviewStatistics(): Promise<ReportOverviewStatisticsDto> {
    this.logger.debug('Fetching report overview statistics', {
      context: LOGGING_CONTEXT,
    })

    const nonDraftStatuses = [
      ReportStatusEnum.SUBMITTED,
      ReportStatusEnum.IN_REVIEW,
      ReportStatusEnum.APPROVED,
      ReportStatusEnum.DENIED,
      ReportStatusEnum.SUPERSEDED,
    ]

    const now = new Date()

    const last30DaysStart = new Date(now)
    last30DaysStart.setUTCDate(last30DaysStart.getUTCDate() - 30)
    last30DaysStart.setUTCHours(0, 0, 0, 0)

    const currentYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))

    const groupByStatus = async (from?: Date) => {
      const rows = (await this.reportModel.findAll({
        attributes: [
          'status',
          [fn('COUNT', col(`${ReportModel.name}.id`)), 'count'],
        ],
        where: {
          status: { [Op.in]: nonDraftStatuses },
          ...(from ? { createdAt: { [Op.gte]: from } } : {}),
        },
        group: ['status'],
        raw: true,
      })) as unknown as { status: ReportStatusEnum; count: string }[]

      return this.buildStatisticsWindow(rows)
    }

    const [last30Days, currentYear, allTime] = await Promise.all([
      groupByStatus(last30DaysStart),
      groupByStatus(currentYearStart),
      groupByStatus(),
    ])

    return { last30Days, currentYear, allTime }
  }

  private buildStatisticsWindow(
    rows: { status: ReportStatusEnum; count: string }[],
  ): ReportStatisticsWindowDto {
    const items: ReportStatisticsItemDto[] = rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
      percentage: 0,
    }))

    const total = items.reduce((sum, i) => sum + i.count, 0)

    for (const item of items) {
      item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
    }

    return { items, total }
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
    includesImprovementPlan: boolean
  }> {
    if (report.type !== ReportTypeEnum.SALARY || !report.result) {
      return { result: null, roleResults: [], includesImprovementPlan: false }
    }

    // Outlier rows themselves are served by the paginated
    // `GET /reports/:id/outliers` endpoint — too many to inline into the
    // detail payload. We only need the boolean here, so a count is enough.
    const [roleResultRows, outlierCount] = await Promise.all([
      this.reportRoleResultModel.findAll({
        where: { reportResultId: report.result.id },
      }),
      this.reportEmployeeOutlierModel.count({
        include: [
          {
            model: ReportEmployeeModel,
            as: 'reportEmployee',
            attributes: ['gender', 'score'],
            where: { reportId: report.id },
            required: true,
            include: [
              {
                model: ReportEmployeeRoleModel,
                as: 'role',
                attributes: ['title'],
              },
            ],
          },
        ],
      }),
    ])

    return {
      result: report.result.fromModel(),
      roleResults: roleResultRows.map((r) => r.fromModel()),
      includesImprovementPlan: outlierCount > 0,
    }
  }

  async getOutliers(
    reportId: string,
    query: GetReportOutliersQueryDto,
  ): Promise<GetReportOutliersResponseDto> {
    this.logger.debug('Listing report outliers', {
      context: LOGGING_CONTEXT,
      reportId,
    })

    // Verify the report exists + load its result so we can project each
    // outlier with the matching analysis snapshot entry.
    const report = await this.reportModel
      .withScope('detailed')
      .findByPkOrThrow(reportId)

    const { limit, offset } = getLimitAndOffset(query)

    const { rows, count } = await this.reportEmployeeOutlierModel.findAndCountAll({
      include: [
        {
          model: ReportEmployeeModel,
          as: 'reportEmployee',
          attributes: ['id', 'ordinal', 'gender', 'score'],
          where: { reportId: report.id },
          required: true,
          include: [
            {
              model: ReportEmployeeRoleModel,
              as: 'role',
              attributes: ['id', 'title'],
              required: false,
            },
          ],
        },
      ],
      order: this.buildOutlierOrder(query),
      limit,
      offset,
      distinct: true,
      subQuery: false,
    })

    const analysisByOrdinal = new Map(
      report.result?.outlierAnalysisSnapshot.employees.map((employee) => [
        employee.ordinal,
        employee,
      ]) ?? [],
    )

    const outliers = rows.map((row) =>
      row.fromModel(
        row.reportEmployee
          ? analysisByOrdinal.get(row.reportEmployee.ordinal) ?? null
          : null,
      ),
    )

    const paging = generatePaging(outliers, query.page, query.pageSize, count)

    return { outliers, paging }
  }

  /**
   * Map the outliers sort DTO to a Sequelize `order`. Only DB-backed columns
   * on the joined `report_employee` (and its `role`) are sortable — the
   * analysis-snapshot fields aren't part of the query, so they're not exposed
   * (enum-gated). A secondary `ordinal ASC` keeps paging deterministic when
   * the primary sort column has ties. With no `sortBy`, falls back to the
   * default ordinal-ascending order that matches the FE improvement-plan list.
   */
  private buildOutlierOrder(query: GetReportOutliersQueryDto): Order {
    const reportEmployee = { model: ReportEmployeeModel, as: 'reportEmployee' }
    const ordinalAsc: Order = [[reportEmployee, 'ordinal', 'ASC']]

    if (!query.sortBy) return ordinalAsc

    const direction = query.direction === SortDirectionEnum.DESC ? 'DESC' : 'ASC'

    switch (query.sortBy) {
      case ReportOutlierSortByEnum.EMPLOYEE_ORDINAL:
        return [[reportEmployee, 'ordinal', direction]]
      case ReportOutlierSortByEnum.GENDER:
        return [[reportEmployee, 'gender', direction], ...ordinalAsc]
      case ReportOutlierSortByEnum.SCORE:
        return [[reportEmployee, 'score', direction], ...ordinalAsc]
      case ReportOutlierSortByEnum.ROLE_TITLE:
        return [
          [
            reportEmployee,
            { model: ReportEmployeeRoleModel, as: 'role' },
            'title',
            direction,
          ],
          ...ordinalAsc,
        ]
      default:
        return ordinalAsc
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
    } else {
      // Withdrawn reports are not surfaced in admin list views by default.
      // Callers can still request them explicitly via `query.status`.
      Object.assign(where, {
        status: { [Op.ne]: ReportStatusEnum.WITHDRAWN },
      })
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

    if (query.hasImprovementPlan !== undefined) {
      Object.assign(where, buildImprovementPlanWhere(query.hasImprovementPlan))
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
