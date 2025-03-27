import { IsEnum, IsString, IsUUID } from 'class-validator'
import { AttachmentTypeEnum } from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class ApplicationAttachmentType {
  @ApiProperty({
    type: String,
    description: 'Id of the attachment type',
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    enum: AttachmentTypeEnum,
    description: 'Title of the attachment type',
  })
  @IsEnum(AttachmentTypeEnum)
  title!: AttachmentTypeEnum

  @ApiProperty({
    type: String,
    description: 'Slug of the attachment type',
  })
  @IsString()
  slug!: string
}
