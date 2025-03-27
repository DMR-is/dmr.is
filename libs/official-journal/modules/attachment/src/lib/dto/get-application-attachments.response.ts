import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAttachment } from './application-attachment.dto'

export class GetApplicationAttachmentsResponse {
  @ApiProperty({
    type: [ApplicationAttachment],
    description: 'Array of attachments tied to the application',
  })
  @Type(() => ApplicationAttachment)
  @ValidateNested()
  attachments!: ApplicationAttachment[]
}
