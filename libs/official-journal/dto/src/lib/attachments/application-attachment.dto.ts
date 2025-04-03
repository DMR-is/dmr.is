import { IsEnum, IsString, IsUUID } from 'class-validator'
import { AttachmentTypeEnum } from '@dmr.is/constants'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'

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

export class ApplicationAttachment {
  @ApiProperty({
    type: String,
    description: 'Id of the attachment',
  })
  @IsUUID()
  id!: string

  @ApiProperty({
    type: String,
    description: 'Id of the application',
  })
  @IsUUID()
  applicationId!: string

  @ApiProperty({
    type: String,
    description: 'Original file name',
  })
  originalFileName!: string

  @ApiProperty({
    type: String,
    description: 'File name',
  })
  fileName!: string

  @ApiProperty({
    type: String,
    description: 'File format',
  })
  fileFormat!: string

  @ApiProperty({
    type: String,
    description: 'File extension',
  })
  fileExtension!: string

  @ApiProperty({
    type: Number,
    description: 'File size',
  })
  fileSize!: number

  @ApiProperty({
    type: String,
    description: 'File location',
  })
  fileLocation!: string

  @ApiProperty({
    type: ApplicationAttachmentType,
    description: 'Attachment type',
  })
  type!: ApplicationAttachmentType

  @ApiProperty({
    type: Boolean,
    description: 'Deleted',
  })
  deleted!: boolean
}

export class ApplicationAttachments {
  @ApiProperty({
    type: [ApplicationAttachment],
    description: 'The attachments of the application',
  })
  @Type(() => ApplicationAttachment)
  @ValidateNested()
  attachments!: ApplicationAttachment[]
}
