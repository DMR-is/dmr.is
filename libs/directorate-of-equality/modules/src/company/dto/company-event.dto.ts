import {
  ApiDateTime,
  ApiEnum,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanyStatusEnum } from '../models/company.enums'
import {
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
} from '../models/company-event.model'

export class CompanyEventDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  companyId!: string

  @ApiEnum(CompanyEventTypeEnum, { enumName: 'CompanyEventTypeEnum' })
  eventType!: CompanyEventTypeEnum

  @ApiOptionalUuid({ nullable: true })
  actorUserId!: string | null

  @ApiOptionalString({ nullable: true })
  actorName!: string | null

  @ApiEnum(CompanyStatusEnum, { enumName: 'CompanyStatusEnum' })
  status!: CompanyStatusEnum

  @ApiOptionalEnum(CompanyStatusEnum, {
    enumName: 'CompanyStatusEnum',
    nullable: true,
  })
  fromStatus!: CompanyStatusEnum | null

  @ApiOptionalEnum(CompanyStatusEnum, {
    enumName: 'CompanyStatusEnum',
    nullable: true,
  })
  toStatus!: CompanyStatusEnum | null

  @ApiOptionalString({ nullable: true })
  reason!: string | null

  @ApiOptionalEnum(CompanyReminderTierEnum, {
    enumName: 'CompanyReminderTierEnum',
    nullable: true,
  })
  reminderTier!: CompanyReminderTierEnum | null

  @ApiDateTime()
  createdAt!: Date
}
