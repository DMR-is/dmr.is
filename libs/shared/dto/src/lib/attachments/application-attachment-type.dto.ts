import { IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class ApplicationAttachmentType {
  @ApiProperty({
    type: String,
    description: 'Id of the attachment type',
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the attachment type',
  })
  @IsString()
  title!: string

  @ApiProperty({
    type: String,
    description: 'Slug of the attachment type',
  })
  @IsString()
  slug!: string
}
