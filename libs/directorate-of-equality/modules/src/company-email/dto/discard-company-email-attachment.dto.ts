import { IsString, MaxLength, MinLength } from 'class-validator'

import { ApiString } from '@dmr.is/decorators'

export class DiscardCompanyEmailAttachmentDto {
  @ApiString({
    description:
      'Staging key of an attachment the admin removed before sending. Refused unless it sits inside the mail-attachment prefix, so this cannot be pointed at an import workbook or an already-archived message.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  key!: string
}
