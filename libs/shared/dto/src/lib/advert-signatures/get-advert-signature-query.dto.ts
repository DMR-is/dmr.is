import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetAdvertSignatureQuery {
  @ApiProperty({
    type: String,
    description: 'Search for a specific signature by id',
    required: false,
  })
  @IsString()
  @IsOptional()
  id?: string

  @ApiProperty({
    type: String,
    description: 'Search for a specific signature by type',
    example: 'Regular',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string

  @ApiProperty({
    type: String,
    description: 'Search for a specific signature',
    example: 'Dagur B. Eggertsson',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string

  @ApiProperty({
    name: 'page',
    description: 'Page number to return.',
    type: Number,
    required: false,
  })
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number
}
