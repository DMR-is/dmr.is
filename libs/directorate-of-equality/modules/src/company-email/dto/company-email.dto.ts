import { ApiProperty } from '@nestjs/swagger'

import {
  ApiDateTime,
  ApiEnum,
  ApiNumber,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanyEmailStatusEnum } from '../models/company-email.enums'

export class CompanyEmailAttachmentDto {
  @ApiUUId()
  id!: string

  @ApiString({ description: 'File name as the recipient saw it.' })
  filename!: string

  @ApiNumber()
  sizeBytes!: number
}

/**
 * A sent message, read back.
 *
 * Backs the timeline expansion: an admin looking at "Tölvupóstur sendur" on a
 * company can open the entry and see the message that actually went out.
 *
 * ⚠️ Batch-wide, not per-company. `sentCount`/`failedCount`/`skippedCount`
 * describe the whole send, so an admin reading this from one company's timeline
 * is seeing how the mailing went overall — which is the useful question when the
 * entry in front of them says FAILED.
 */
export class CompanyEmailDto {
  @ApiUUId()
  id!: string

  @ApiString()
  subject!: string

  @ApiString({
    description:
      'The sanitised HTML exactly as delivered. Safe to render — it was sanitised once, before being stored.',
  })
  bodyHtml!: string

  @ApiEnum(CompanyEmailStatusEnum, { enumName: 'CompanyEmailStatusEnum' })
  status!: CompanyEmailStatusEnum

  @ApiOptionalString({
    nullable: true,
    description: 'Reviewer who sent it, or null if their user row is gone.',
  })
  createdByName!: string | null

  @ApiNumber({ description: 'Recipients delivered to.' })
  sentCount!: number

  @ApiNumber({ description: 'Recipients whose send failed.' })
  failedCount!: number

  @ApiNumber({ description: 'Recipients skipped before any attempt.' })
  skippedCount!: number

  @ApiNumber({ description: 'Recipients not yet attempted.' })
  pendingCount!: number

  @ApiProperty({ type: CompanyEmailAttachmentDto, isArray: true })
  attachments!: CompanyEmailAttachmentDto[]

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDateTime({ nullable: true })
  completedAt!: Date | null
}
