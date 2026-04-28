import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportStatusEnum } from '../report/models/report.model'
import {
  ReportEventModel,
  ReportEventTypeEnum,
} from '../report/models/report-event.model'
import { IReportEventService } from './report-event.service.interface'

const LOGGING_CONTEXT = 'ReportEventService'

@Injectable()
export class ReportEventService implements IReportEventService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
  ) {}

  async emitSubmitted(reportId: string, companyId: string): Promise<void> {
    this.logger.info(`Emitting SUBMITTED event for report ${reportId}`, {
      context: LOGGING_CONTEXT,
      reportId: reportId,
    })

    await this.reportEventModel.create({
      reportId,
      eventType: ReportEventTypeEnum.SUBMITTED,
      actorUserId: null,
      reportStatus: ReportStatusEnum.SUBMITTED,
      companyId,
    })
  }

  async emitAssigned(
    reportId: string,
    actorUserId: string,
    assignedUserId: string,
  ): Promise<void> {
    this.logger.info(`Emitting ASSIGNED event for report ${reportId}`, {
      context: LOGGING_CONTEXT,
      reportId: reportId,
    })

    await this.reportEventModel.create({
      reportId,
      eventType: ReportEventTypeEnum.ASSIGNED,
      actorUserId,
      reportStatus: ReportStatusEnum.IN_REVIEW,
      assignedUserId,
    })
  }

  async emitStatusChanged(
    reportId: string,
    fromStatus: ReportStatusEnum,
    toStatus: ReportStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void> {
    this.logger.info(
      `Emitting STATUS_CHANGED event for report ${reportId}: ${fromStatus} → ${toStatus}`,
      { context: LOGGING_CONTEXT, reportId: reportId, fromStatus, toStatus },
    )

    await this.reportEventModel.create({
      reportId,
      eventType: ReportEventTypeEnum.STATUS_CHANGED,
      actorUserId: actorUserId ?? null,
      reportStatus: toStatus,
      fromStatus,
      toStatus,
      reason: reason ?? null,
    })
  }

  async emitSuperseded(
    reportId: string,
    relatedReportId: string,
  ): Promise<void> {
    this.logger.info(`Emitting SUPERSEDED event for report ${reportId}`, {
      context: LOGGING_CONTEXT,
      reportId: reportId,
      relatedReportId: relatedReportId,
    })

    await this.reportEventModel.create({
      reportId,
      eventType: ReportEventTypeEnum.SUPERSEDED,
      actorUserId: null,
      reportStatus: ReportStatusEnum.SUPERSEDED,
      relatedReportId,
    })
  }
}
