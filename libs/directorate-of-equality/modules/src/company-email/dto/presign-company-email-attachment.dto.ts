import { IsString, MaxLength, MinLength } from 'class-validator'

import { ApiString } from '@dmr.is/decorators'

export class PresignCompanyEmailAttachmentDto {
  @ApiString({
    description:
      "Original file name. Only its extension is used, to build the staging key — the name the recipient sees is sent with the message itself, so this is never what the object is stored as. An extension outside the mail-attachment allow-list is a 400.",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string
}
