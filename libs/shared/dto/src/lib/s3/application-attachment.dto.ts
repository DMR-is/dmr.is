import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

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
    type: Boolean,
    description: 'Deleted',
  })
  deleted!: boolean
}
