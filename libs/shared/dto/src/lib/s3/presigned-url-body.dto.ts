import { IsBoolean, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetPresignedUrlBody {
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
  fileType!: string

  @ApiProperty({
    type: Boolean,
    required: true,
  })
  @IsBoolean()
  isOriginal!: boolean
}
