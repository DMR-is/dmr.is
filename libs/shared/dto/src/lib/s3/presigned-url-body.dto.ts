import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetPresignedUrlBody {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @MinLength(1)
  fileName!: string

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(4)
  fileType!: string
}
