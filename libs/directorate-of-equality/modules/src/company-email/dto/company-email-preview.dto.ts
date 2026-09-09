import { ApiProperty } from '@nestjs/swagger'

import {
  ApiEnum,
  ApiNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanyEmailRecipientStatusEnum } from '../models/company-email.enums'

export class CompanyEmailRecipientPreviewDto {
  @ApiUUId()
  companyId!: string

  @ApiString({ description: 'Company name — what the recipient list shows.' })
  companyName!: string

  @ApiOptionalString({
    nullable: true,
    description:
      'Address the message will go to, revealed when the recipient row is expanded. Null when no address could be resolved — the company has none on file, or was skipped for quarantine and happens to have none either. `reason` says which.',
  })
  email!: string | null
}

export class CompanyEmailSkippedPreviewDto extends CompanyEmailRecipientPreviewDto {
  @ApiEnum(CompanyEmailRecipientStatusEnum, {
    enumName: 'CompanyEmailRecipientStatusEnum',
    description:
      'Why this company is excluded — SKIPPED_NO_EMAIL or SKIPPED_QUARANTINED.',
  })
  reason!: CompanyEmailRecipientStatusEnum
}

/**
 * What the confirmation step shows before anything is sent.
 *
 * ⚠️ `recipients` and `skipped` are both returned, and the counts are meant to
 * be read together: the list screen's button counts every company matching the
 * filter, and this is where an admin finds out that some of them will not be
 * written to and why. A preview that returned only the deliverable set would
 * show a smaller number than the button with nothing to explain the gap.
 */
export class CompanyEmailPreviewDto {
  @ApiProperty({ type: CompanyEmailRecipientPreviewDto, isArray: true })
  recipients!: CompanyEmailRecipientPreviewDto[]

  @ApiProperty({ type: CompanyEmailSkippedPreviewDto, isArray: true })
  skipped!: CompanyEmailSkippedPreviewDto[]

  @ApiNumber({ description: 'Companies that will receive the message.' })
  recipientCount!: number

  @ApiNumber({ description: 'Companies excluded, for either skip reason.' })
  skippedCount!: number
}
