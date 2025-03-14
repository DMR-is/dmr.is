import { Transform } from 'class-transformer'
import { IsArray, IsOptional, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class CaseTransaction {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'Reference to external source',
  })
  readonly externalReference!: string

  @ApiProperty({
    type: Number,
    description: 'Advert price',
    required: false,
  })
  readonly price!: number | null

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Fee codes to get the price for',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  readonly feeCodes!: string[] | null
}
