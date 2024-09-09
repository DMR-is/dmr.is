import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateTitleBody {
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title!: string

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  @IsNotEmpty()
  applicationId!: string
}
