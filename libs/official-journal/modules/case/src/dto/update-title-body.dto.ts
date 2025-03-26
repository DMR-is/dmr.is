import { IsNotEmpty, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateTitleBody {
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title!: string
}
