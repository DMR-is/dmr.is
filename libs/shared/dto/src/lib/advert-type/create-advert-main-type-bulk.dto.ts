import { Type } from 'class-transformer'
import { IsArray, ValidateNested } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { CreateAdvertMainTypeBody } from './create-advert-main-type.dto'

export class CreateAdvertMainTypeBulk {
  @ApiProperty({
    type: [CreateAdvertMainTypeBody],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdvertMainTypeBody)
  @ApiProperty({ type: [CreateAdvertMainTypeBody] })
  mainTypes!: CreateAdvertMainTypeBody[]
}
