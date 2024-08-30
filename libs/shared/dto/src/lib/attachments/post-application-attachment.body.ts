import { IsNumber, IsString, IsUrl } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class PostApplicationAttachmentBody {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  fileName!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  originalFileName!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  fileFormat!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  fileExtension!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  fileLocation!: string

  @ApiProperty({
    type: Number,
    required: true,
  })
  @IsNumber()
  fileSize!: number
}
