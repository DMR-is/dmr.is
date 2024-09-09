import { ArrayMinSize, IsArray, IsString, IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCategoriesBody {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categoryIds!: string[]

  @ApiProperty({
    type: String,
  })
  @IsUUID()
  applicationId!: string
}
