import {
  ApiDateTime,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanySectorEnum, CompanyStatusEnum } from '../models/company.enums'
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

  @ApiOptionalUuid({
    nullable: true,
    description:
      'The custom-email batch this event belongs to, on CUSTOM_EMAIL_* events only; null otherwise. The timeline uses it to fetch the message that was actually sent.',
  })
  companyEmailId!: string | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'The next-due date before the change, on *_DUE_DATE_CHANGED events only; null when the company had none, and on every other event.',
  })
  fromDueAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'The next-due date after the change, on *_DUE_DATE_CHANGED events only; null otherwise.',
  })
  toDueAt!: Date | null

  @ApiOptionalEnum(CompanySectorEnum, {
    enumName: 'CompanySectorEnum',
    nullable: true,
    description:
      'The sector before the change, on SECTOR_CHANGED events only; null otherwise.',
  })
  fromSector!: CompanySectorEnum | null

  @ApiOptionalEnum(CompanySectorEnum, {
    enumName: 'CompanySectorEnum',
    nullable: true,
    description:
      'The sector after the change, on SECTOR_CHANGED events only; null otherwise.',
  })
  toSector!: CompanySectorEnum | null

  @ApiDateTime()
  createdAt!: Date
}
