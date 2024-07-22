import { ArrayMinSize, IsArray, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class UpdateCategoriesBody {
  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categoryIds!: string[]
}
