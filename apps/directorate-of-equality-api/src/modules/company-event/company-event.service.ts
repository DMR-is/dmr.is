import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyEventDto } from '../company/dto/company-event.dto'
import { CompanyStatusEnum } from '../company/models/company.enums'
import {
  CompanyDeadlineReminderEventType,
  CompanyEventModel,
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
} from '../company/models/company-event.model'
import { UserModel } from '../user/models/user.model'
import { ICompanyEventService } from './company-event.service.interface'

const LOGGING_CONTEXT = 'CompanyEventService'

@Injectable()
export class CompanyEventService implements ICompanyEventService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyEventModel)
    private readonly companyEventModel: typeof CompanyEventModel,
  ) {}

  async emitCreated(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
  ): Promise<void> {
    this.logger.info(`Emitting CREATED event for company ${companyId}`, {
      context: LOGGING_CONTEXT,
      companyId,
    })

    await this.companyEventModel.create({
      companyId,
      eventType: CompanyEventTypeEnum.CREATED,
      actorUserId: actorUserId ?? null,
      status,
    })
  }

  async emitStatusChanged(
    companyId: string,
    fromStatus: CompanyStatusEnum,
    toStatus: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void> {
    this.logger.info(
      `Emitting STATUS_CHANGED event for company ${companyId}: ${fromStatus} → ${toStatus}`,
      { context: LOGGING_CONTEXT, companyId, fromStatus, toStatus },
    )

    await this.companyEventModel.create({
      companyId,
      eventType: CompanyEventTypeEnum.STATUS_CHANGED,
      actorUserId: actorUserId ?? null,
      status: toStatus,
      fromStatus,
      toStatus,
      reason: reason ?? null,
    })
  }

  async emitFinesStarted(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void> {
    this.logger.info(`Emitting FINES_STARTED event for company ${companyId}`, {
      context: LOGGING_CONTEXT,
      companyId,
    })

    await this.companyEventModel.create({
      companyId,
      eventType: CompanyEventTypeEnum.FINES_STARTED,
      actorUserId: actorUserId ?? null,
      status,
      reason: reason ?? null,
    })
  }

  async emitFinesStopped(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void> {
    this.logger.info(`Emitting FINES_STOPPED event for company ${companyId}`, {
      context: LOGGING_CONTEXT,
      companyId,
    })

    await this.companyEventModel.create({
      companyId,
      eventType: CompanyEventTypeEnum.FINES_STOPPED,
      actorUserId: actorUserId ?? null,
      status,
      reason: reason ?? null,
    })
  }

  async emitQuarantined(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void> {
    this.logger.info(`Emitting QUARANTINED event for company ${companyId}`, {
      context: LOGGING_CONTEXT,
      companyId,
    })

    await this.companyEventModel.create({
      companyId,
      eventType: CompanyEventTypeEnum.QUARANTINED,
      actorUserId: actorUserId ?? null,
      status,
      reason: reason ?? null,
    })
  }

  async emitUnquarantined(
    companyId: string,
    status: CompanyStatusEnum,
    actorUserId?: string | null,
    reason?: string | null,
  ): Promise<void> {
    this.logger.info(`Emitting UNQUARANTINED event for company ${companyId}`, {
      context: LOGGING_CONTEXT,
      companyId,
    })

    await this.companyEventModel.create({
      companyId,
      eventType: CompanyEventTypeEnum.UNQUARANTINED,
      actorUserId: actorUserId ?? null,
      status,
      reason: reason ?? null,
    })
  }

  async getByCompanyId(companyId: string): Promise<CompanyEventDto[]> {
    const events = await this.companyEventModel.findAll({
      where: { companyId },
      include: [{ model: UserModel, as: 'actor', required: false }],
      order: [['createdAt', 'ASC']],
    })

    return events.map((event) => event.fromModel())
  }

  async hasDeadlineReminderEvent(
    companyId: string,
    eventType: CompanyDeadlineReminderEventType,
    tier: CompanyReminderTierEnum,
    dueDateIso: string,
  ): Promise<boolean> {
    const existing = await this.companyEventModel.findOne({
      where: { companyId, eventType, reminderTier: tier, reason: dueDateIso },
      attributes: ['id'],
    })

    return existing !== null
  }

  async emitDeadlineReminderEvent(
    companyId: string,
    status: CompanyStatusEnum,
    eventType: CompanyDeadlineReminderEventType,
    tier: CompanyReminderTierEnum,
    dueDateIso: string,
  ): Promise<void> {
    this.logger.info(
      `Emitting ${eventType} (${tier}) event for company ${companyId} (due ${dueDateIso})`,
      { context: LOGGING_CONTEXT, companyId, eventType, tier, dueDateIso },
    )

    await this.companyEventModel.create({
      companyId,
      eventType,
      status,
      reason: dueDateIso,
      reminderTier: tier,
    })
  }
}
