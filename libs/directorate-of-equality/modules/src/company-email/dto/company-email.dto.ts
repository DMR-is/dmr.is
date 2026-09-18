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
 * A sent message, read back — backs the timeline expansion.
 *
 * The counts are batch-wide, not per-company: an admin reading this from one
 * company's timeline sees how the mailing went overall, which is the useful
 * question when the entry in front of them says FAILED.
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

  @ApiOptionalString({
    nullable: true,
    description:
      'Address that received a copy of this message — normally the sender. Null when none was asked for. One copy per batch, never a per-recipient BCC, and no company received it as a recipient.',
  })
  copyToEmail!: string | null

  @ApiProperty({ type: CompanyEmailAttachmentDto, isArray: true })
  attachments!: CompanyEmailAttachmentDto[]

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDateTime({ nullable: true })
  completedAt!: Date | null
}
