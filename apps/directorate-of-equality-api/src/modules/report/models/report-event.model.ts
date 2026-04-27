import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { UserModel } from '../../user/models/user.model'
import type { ReportEventDto } from '../dto/report-event.dto'
import { ReportModel, ReportStatusEnum } from './report.model'

export enum ReportEventTypeEnum {
  SUBMITTED = 'SUBMITTED',
  ASSIGNED = 'ASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  SUPERSEDED = 'SUPERSEDED',
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

  static fromModel(model: ReportEventModel): ReportEventDto {
    return {
      id: model.id,
      reportId: model.reportId,
      eventType: model.eventType,
      actorUserId: model.actorUserId,
      reportStatus: model.reportStatus,
      fromStatus: model.fromStatus,
      toStatus: model.toStatus,
      assignedUserId: model.assignedUserId,
      reason: model.reason,
      relatedReportId: model.relatedReportId,
    }
  }

  fromModel(): ReportEventDto {
    return ReportEventModel.fromModel(this)
  }
}
