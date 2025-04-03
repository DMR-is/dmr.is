import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { ApplicationAttachment } from './application-attachment.dto'

export class ApplicationAttachments {
  @ApiProperty({
    type: [ApplicationAttachment],
    description: 'The attachments of the application',
  })
  @Type(() => ApplicationAttachment)
  @ValidateNested()
  attachments!: ApplicationAttachment[]
}
