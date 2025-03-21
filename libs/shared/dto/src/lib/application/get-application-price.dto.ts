import { Transform } from 'class-transformer'
import { IsArray, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetApplicationPriceQuery {
  @ApiProperty({
    type: [String],
    required: false,
    description: 'Fee codes to get the price for',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  feeCodes?: string[]
}
