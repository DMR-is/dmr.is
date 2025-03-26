import { IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class DeleteApplicationAttachmentBody {
  @ApiProperty({
    type: String,
    description: 'The key of the attachment to delete',
  })
  @IsString()
  key!: string
}
