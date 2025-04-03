import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAttachment } from './application-attachment.dto'

export class GetApplicationAttachmentResponse {
  @ApiProperty({
    type: ApplicationAttachment,
    description: 'The attachment of the application',
  })
  @Type(() => ApplicationAttachment)
  @ValidateNested()
  attachment!: ApplicationAttachment
}
