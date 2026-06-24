import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IApplicationSystemService } from '../application-system/application-system.service.interface'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import {
  ReportModel,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { IReportEventService } from '../report-event/report-event.service.interface'
import { UserModel } from '../user/models/user.model'
import { AssignReportDto } from './dto/assign-report.dto'
import { DenyReportDto } from './dto/deny-report.dto'
import { IReportWorkflowService } from './report-workflow.service.interface'

const LOGGING_CONTEXT = 'ReportWorkflowService'

@Injectable()
export class ReportWorkflowService implements IReportWorkflowService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportEventService)
    private readonly reportEventService: IReportEventService,
    @Inject(IApplicationSystemService)
    private readonly applicationSystemService: IApplicationSystemService,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
    @InjectModel(ReportOutlierGroupModel)
    private readonly reportOutlierGroupModel: typeof ReportOutlierGroupModel,
  ) {}

  async assign(
    context: ReportResourceContext,
    dto: AssignReportDto,
  ): Promise<void> {
    this.logger.info(`Assigning report ${context.reportId} to reviewer`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may assign reports')
    }

    const actorUserId = context.actor.userId

    // Resolve target reviewer:
    // - undefined → assign to caller
    // - UUID → assign to that user (must be active)
    // - null → unassign
    const targetUserId =
      dto.userId === undefined ? actorUserId : dto.userId

    if (targetUserId !== null) {
      const targetUser = await this.userModel.findOne({
        where: { id: targetUserId },
        attributes: ['id', 'isActive'],
      })

      if (!targetUser || !targetUser.isActive) {
        throw new BadRequestException(
          `Target reviewer ${targetUserId} is not an active user`,
        )
      }
    }

    // Status transitions:
    // - SUBMITTED + target  → IN_REVIEW
    // - IN_REVIEW + target  → IN_REVIEW (reassignment)
    // - IN_REVIEW + null    → SUBMITTED (return to queue)
    // - anything else       → 400
    let nextStatus: ReportStatusEnum
    if (context.reportStatus === ReportStatusEnum.SUBMITTED) {
      if (targetUserId === null) {
        throw new BadRequestException(
          'Cannot unassign a report that is not in review',
        )
      }
      nextStatus = ReportStatusEnum.IN_REVIEW
    } else if (context.reportStatus === ReportStatusEnum.IN_REVIEW) {
      nextStatus =
        targetUserId === null
          ? ReportStatusEnum.SUBMITTED
          : ReportStatusEnum.IN_REVIEW
    } else {
      throw new BadRequestException(
        `Cannot assign report with status ${context.reportStatus}`,
      )
    }

    const currentReviewerUserId = await this.getReviewerUserId(context.reportId)

    // No-op: same reviewer, same status. Skip writing the event log.
    if (
      currentReviewerUserId === targetUserId &&
      context.reportStatus === nextStatus
    ) {
      return
    }

    await this.reportModel.update(
      { status: nextStatus, reviewerUserId: targetUserId },
      { where: { id: context.reportId } },
    )

    if (targetUserId === null) {
      await this.reportEventService.emitUnassigned(
        context.reportId,
        actorUserId,
        currentReviewerUserId,
      )
    } else {
      await this.reportEventService.emitAssigned(
        context.reportId,
        actorUserId,
        targetUserId,
      )
    }
  }

  private async getReviewerUserId(reportId: string): Promise<string | null> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['reviewerUserId'],
    })
    return report?.reviewerUserId ?? null
  }

  async deny(
    context: ReportResourceContext,
    dto: DenyReportDto,
  ): Promise<void> {
    this.logger.info(`Denying report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may deny reports')
    }

    if (context.reportStatus !== ReportStatusEnum.IN_REVIEW) {
      throw new BadRequestException(
        `Cannot deny report with status ${context.reportStatus}`,
      )
    }

    const denialReason = dto.denialReason.trim()

    if (!denialReason) {
      throw new BadRequestException('Denial reason cannot be empty')
    }

    const actorUserId = context.actor.userId

    await this.reportModel.update(
      {
        status: ReportStatusEnum.DENIED,
        reviewerUserId: actorUserId,
      },
      { where: { id: context.reportId } },
    )

    await this.reportEventService.emitStatusChanged(
      context.reportId,
      ReportStatusEnum.IN_REVIEW,
      ReportStatusEnum.DENIED,
      actorUserId,
      denialReason,
    )

    await this.notifyApplicationSystem(context.reportId, ReportStatusEnum.DENIED)
  }

  async approve(context: ReportResourceContext): Promise<void> {
    this.logger.info(`Approving report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may approve reports')
    }

    if (context.reportStatus !== ReportStatusEnum.IN_REVIEW) {
      throw new BadRequestException(
        `Cannot approve report with status ${context.reportStatus}`,
      )
    }

    await this.assertOutlierExplanationsResolved(context.reportId)

    const actorUserId = context.actor.userId
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setFullYear(validUntil.getFullYear() + 3)

    await this.reportModel.update(
      {
        status: ReportStatusEnum.APPROVED,
        approvedAt: now,
        validUntil,
        reviewerUserId: actorUserId,
      },
      { where: { id: context.reportId } },
    )

    // Keep the company's next-due date in step with the report's validity. The
    // launch seed sets these dates initially (no reports exist yet); from then
    // on every approval advances them, so `next_*_report_due_at` stays the live
    // source of truth the salary renewal-window check reads.
    await this.advanceCompanyReportDueDate(context.reportId, validUntil)

    await this.supersedePreviousApproved(context.reportId)

    await this.reportEventService.emitStatusChanged(
      context.reportId,
      ReportStatusEnum.IN_REVIEW,
      ReportStatusEnum.APPROVED,
      actorUserId,
    )

    await this.notifyApplicationSystem(
      context.reportId,
      ReportStatusEnum.APPROVED,
    )

    // TODO: insert public_report row as part of approval pipeline
  }

  /**
   * Best-effort outbound notification to the island.is application system that
   * a report's review concluded. Only island.is-sourced reports have an
   * application to update — Excel-imported / system reports are skipped.
   *
   * The local status change is already committed and event-logged at this
   * point; a failed outbound call must NOT surface as an error to the admin
   * (the approval/denial stands). We log and move on. A retry/outbox mechanism
   * can be layered on later if eventual consistency proves insufficient.
   */
  private async notifyApplicationSystem(
    reportId: string,
    status: ReportStatusEnum.APPROVED | ReportStatusEnum.DENIED,
  ): Promise<void> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['providerType', 'providerId'],
    })

    if (
      report?.providerType !== ReportProviderEnum.ISLAND_IS ||
      !report.providerId
    ) {
      return
    }

    try {
      if (status === ReportStatusEnum.APPROVED) {
        await this.applicationSystemService.notifyApproved(report.providerId)
      } else {
        await this.applicationSystemService.notifyDenied(report.providerId)
      }
    } catch (error) {
      this.logger.error(
        `Failed to notify application system for report ${reportId} (${status})`,
        {
          context: LOGGING_CONTEXT,
          applicationId: report.providerId,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }
  }

  /**
   * Belt-and-suspenders gate: a SALARY report with an outlier group whose
   * explanation has not been filled in (i.e. was submitted with
   * `outliersPostponed = true` and the applicant has not resolved it via the
   * outliers edit endpoint) cannot be approved. EQUALITY reports have no
   * outlier groups, so the query is a cheap no-op for them.
   *
   * The explanation lives on the outlier group, and the group's columns are
   * all-or-none, so "unresolved" means a group with a null `reason` (postponed
   * default group, not yet filled). This enforces the lifecycle invariant:
   * status can leave POSTPONED only after every group has a complete
   * explanation.
   */
  private async assertOutlierExplanationsResolved(
    reportId: string,
  ): Promise<void> {
    const unresolved = await this.reportOutlierGroupModel.findOne({
      where: { reportId, reason: null },
      attributes: ['id'],
    })

    if (unresolved) {
      throw new BadRequestException(
        `Cannot approve report ${reportId}: outlier explanations are still pending`,
      )
    }
  }

  /**
   * Mirror an approved report's `validUntil` onto its parent company's
   * next-due column (`next_salary_report_due_at` for SALARY,
   * `next_equality_report_due_at` for EQUALITY). The "due" date a company is
   * measured against is the validity end of its current report, so the two are
   * kept identical here. Subsidiaries carry no obligation of their own; only the
   * parent (`parentCompanyId IS NULL`) snapshot is updated.
   */
  private async advanceCompanyReportDueDate(
    reportId: string,
    validUntil: Date,
  ): Promise<void> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['type'],
    })

    if (!report) {
      return
    }

    const parentSnapshot = await this.companyReportModel.findOne({
      where: { reportId, parentCompanyId: null },
      attributes: ['companyId'],
    })

    if (!parentSnapshot) {
      return
    }

    const column =
      report.type === ReportTypeEnum.SALARY
        ? { nextSalaryReportDueAt: validUntil }
        : { nextEqualityReportDueAt: validUntil }

    await this.companyModel.update(column, {
      where: { id: parentSnapshot.companyId },
    })
  }

  private async supersedePreviousApproved(reportId: string): Promise<void> {
    // Supersession is scoped to `(company, type)` — approving a new SALARY
    // must not invalidate a still-valid APPROVED EQUALITY (and vice versa).
    // See db/README.md → "Report lifecycle" / SUPERSEDED.
    const newReport = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['type'],
    })

    if (!newReport) {
      return
    }

    const newReportType: ReportTypeEnum = newReport.type

    const companyReport = await this.companyReportModel.findOne({
      where: { reportId },
      attributes: ['companyId'],
    })

    if (!companyReport) {
      return
    }

    const siblingReportIds = (
      await this.companyReportModel.findAll({
        where: { companyId: companyReport.companyId },
        attributes: ['reportId'],
      })
    )
      .map((cr) => cr.reportId)
      .filter((id) => id !== reportId)

    if (siblingReportIds.length === 0) {
      return
    }

    const toSupersede = await this.reportModel.findAll({
      where: {
        id: siblingReportIds,
        status: ReportStatusEnum.APPROVED,
        type: newReportType,
      },
      attributes: ['id'],
    })

    if (toSupersede.length === 0) {
      return
    }

    // Close out the old report's validity at "now". Deliberately does NOT touch
    // the company's next-due date — that was already advanced to the new
    // report's validUntil in approve(); the superseded report is no longer the
    // company's current obligation.
    await this.reportModel.update(
      { status: ReportStatusEnum.SUPERSEDED, validUntil: new Date() },
      { where: { id: toSupersede.map((r) => r.id) } },
    )

    for (const report of toSupersede) {
      await this.reportEventService.emitSuperseded(report.id, reportId)
    }
  }
}
