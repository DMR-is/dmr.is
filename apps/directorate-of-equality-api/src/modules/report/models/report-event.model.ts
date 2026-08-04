import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { CompanyModel } from '../../company/models/company.model'
import { UserModel } from '../../user/models/user.model'
import type { ReportEventDto } from '../dto/report-event.dto'
import { ReportModel, ReportStatusEnum } from './report.model'

export enum ReportEventTypeEnum {
  SUBMITTED = 'SUBMITTED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  SUPERSEDED = 'SUPERSEDED',
  EDITED = 'EDITED',
  WITHDRAWN = 'WITHDRAWN',
  SYSTEM_AUTO_REVIEW = 'SYSTEM_AUTO_REVIEW',
  // Reviewer opened / closed the communication thread with the applicant. The
  // AWAITING_RESPONSE <-> RESPONSE_RECEIVED sub-states flip on comments and are
  // not events; only the explicit open/close transitions are recorded.
  COMMUNICATION_OPENED = 'COMMUNICATION_OPENED',
  COMMUNICATION_CLOSED = 'COMMUNICATION_CLOSED',
}

/**
 * The verdict the system reaches on a freshly submitted report. Recorded on a
 * SYSTEM_AUTO_REVIEW event for audit only — during the soft phase it never
 * changes the report's status (see ReportAutoReviewService). `system_decision`
 * is a first-class column so "how often would we have auto-approved?" is a
 * direct query, not an inference from an overloaded status field.
 */
export enum AutoReviewDecisionEnum {
  AUTO_APPROVE = 'AUTO_APPROVE',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

type ReportEventAttributes = {
  reportId: string
  eventType: ReportEventTypeEnum
  actorUserId: string | null
  reportStatus: ReportStatusEnum
  fromStatus: ReportStatusEnum | null
  toStatus: ReportStatusEnum | null
  assignedUserId: string | null
  reason: string | null
  relatedReportId: string | null
  companyId: string | null
  systemDecision: AutoReviewDecisionEnum | null
}

type ReportEventCreateAttributes = {
  reportId: string
  eventType: ReportEventTypeEnum
  actorUserId?: string | null
  reportStatus: ReportStatusEnum
  fromStatus?: ReportStatusEnum | null
  toStatus?: ReportStatusEnum | null
  assignedUserId?: string | null
  reason?: string | null
  relatedReportId?: string | null
  companyId?: string | null
  systemDecision?: AutoReviewDecisionEnum | null
}

@ImmutableTable({ tableName: DoeModels.REPORT_EVENT })
export class ReportEventModel extends ImmutableModel<
  ReportEventAttributes,
  ReportEventCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ReportEventTypeEnum)),
    allowNull: false,
    field: 'event_type',
  })
  eventType!: ReportEventTypeEnum

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'actor_user_id' })
  actorUserId!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ReportStatusEnum)),
    allowNull: false,
    field: 'report_status',
  })
  reportStatus!: ReportStatusEnum

  @Column({
    type: DataType.ENUM(...Object.values(ReportStatusEnum)),
    allowNull: true,
    field: 'from_status',
  })
  fromStatus!: ReportStatusEnum | null

  @Column({
    type: DataType.ENUM(...Object.values(ReportStatusEnum)),
    allowNull: true,
    field: 'to_status',
  })
  toStatus!: ReportStatusEnum | null

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'assigned_user_id' })
  assignedUserId!: string | null

  @Column({ type: DataType.TEXT, allowNull: true })
  reason!: string | null

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'related_report_id' })
  relatedReportId!: string | null

  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'company_id' })
  companyId!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(AutoReviewDecisionEnum)),
    allowNull: true,
    field: 'system_decision',
  })
  systemDecision!: AutoReviewDecisionEnum | null

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  @BelongsTo(() => UserModel, { foreignKey: 'actorUserId', as: 'actor' })
  actor?: UserModel | null

  @BelongsTo(() => UserModel, { foreignKey: 'assignedUserId', as: 'assignee' })
  assignee?: UserModel | null

  @BelongsTo(() => ReportModel, {
    foreignKey: 'relatedReportId',
    as: 'relatedReport',
  })
  relatedReport?: ReportModel | null

  @BelongsTo(() => CompanyModel, { foreignKey: 'companyId', as: 'company' })
  company?: CompanyModel | null

  static fromModel(model: ReportEventModel): ReportEventDto {
    return {
      id: model.id,
      reportId: model.reportId,
      eventType: model.eventType,
      actorUserId: model.actorUserId,
      actorName: model.actor
        ? `${model.actor.firstName} ${model.actor.lastName}`
        : null,
      reportStatus: model.reportStatus,
      fromStatus: model.fromStatus,
      toStatus: model.toStatus,
      assignedUserId: model.assignedUserId,
      assignedUserName: model.assignee
        ? `${model.assignee.firstName} ${model.assignee.lastName}`
        : null,
      reason: model.reason,
      relatedReportId: model.relatedReportId,
      companyId: model.companyId,
      systemDecision: model.systemDecision,
      createdAt: model.createdAt,
    }
  }

  fromModel(): ReportEventDto {
    return ReportEventModel.fromModel(this)
  }
}
