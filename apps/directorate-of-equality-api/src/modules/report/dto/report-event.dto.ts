import {
  ApiEnum,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiUUId,
} from '@dmr.is/decorators'

import { ReportStatusEnum } from '../models/report.model'
import { ReportEventTypeEnum } from '../models/report-event.model'

export class ReportEventDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiEnum(ReportEventTypeEnum, { enumName: 'ReportEventTypeEnum' })
  eventType!: ReportEventTypeEnum

  @ApiOptionalUuid({ nullable: true })
  actorUserId!: string | null

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  reportStatus!: ReportStatusEnum

  @ApiOptionalEnum(ReportStatusEnum, {
    enumName: 'ReportStatusEnum',
    nullable: true,
  })
  fromStatus!: ReportStatusEnum | null

  @ApiOptionalEnum(ReportStatusEnum, {
    enumName: 'ReportStatusEnum',
    nullable: true,
  })
  toStatus!: ReportStatusEnum | null

  @ApiOptionalUuid({ nullable: true })
  assignedUserId!: string | null

  @ApiOptionalString({ nullable: true })
  reason!: string | null

  @ApiOptionalUuid({ nullable: true })
  relatedReportId!: string | null
}
