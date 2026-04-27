import { Sequelize } from 'sequelize-typescript'

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportModel, ReportStatusEnum } from '../report/models/report.model'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { IReportEventService } from '../report-event/report-event.service.interface'
import { DenyReportDto } from './dto/deny-report.dto'
import { IReportWorkflowService } from './report-workflow.service.interface'

const LOGGING_CONTEXT = 'ReportWorkflowService'

@Injectable()
export class ReportWorkflowService implements IReportWorkflowService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportEventService)
    private readonly reportEventService: IReportEventService,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async assign(context: ReportResourceContext): Promise<void> {
    this.logger.info(`Assigning report ${context.reportId} to reviewer`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may assign reports')
    }

    if (context.reportStatus !== ReportStatusEnum.SUBMITTED) {
      throw new BadRequestException(
        `Cannot assign report with status ${context.reportStatus}`,
      )
    }

    const actorUserId = context.actor.userId

    await this.sequelize.transaction(async () => {
      await this.reportModel.update(
        { status: ReportStatusEnum.IN_REVIEW },
        { where: { id: context.reportId } },
      )

      await this.reportEventService.emitAssigned(
        context.reportId,
        actorUserId,
        actorUserId,
      )
    })
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

    await this.sequelize.transaction(async () => {
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
    })
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

    const actorUserId = context.actor.userId
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setFullYear(validUntil.getFullYear() + 3)

    await this.sequelize.transaction(async () => {
      await this.reportModel.update(
        {
          status: ReportStatusEnum.APPROVED,
          approvedAt: now,
          validUntil,
          reviewerUserId: actorUserId,
        },
        { where: { id: context.reportId } },
      )

      await this.supersedePreviousApproved(context.reportId)

      await this.reportEventService.emitStatusChanged(
        context.reportId,
        ReportStatusEnum.IN_REVIEW,
        ReportStatusEnum.APPROVED,
        actorUserId,
      )

      // TODO: insert public_report row as part of approval pipeline
    })
  }

  async startFines(context: ReportResourceContext): Promise<void> {
    this.logger.info(`Starting fines for report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may start fines')
    }

    await this.reportModel.update(
      { finesStartedAt: new Date() },
      { where: { id: context.reportId } },
    )
  }

  private async supersedePreviousApproved(reportId: string): Promise<void> {
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
      where: { id: siblingReportIds, status: ReportStatusEnum.APPROVED },
      attributes: ['id'],
    })

    if (toSupersede.length === 0) {
      return
    }

    await this.reportModel.update(
      { status: ReportStatusEnum.SUPERSEDED, validUntil: new Date() },
      { where: { id: toSupersede.map((r) => r.id) } },
    )

    for (const report of toSupersede) {
      await this.reportEventService.emitSuperseded(report.id, reportId)
    }
  }
}
