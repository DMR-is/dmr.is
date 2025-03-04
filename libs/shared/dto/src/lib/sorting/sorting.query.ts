import { Expose, Transform } from 'class-transformer'
import { IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class SortingQuery {
  @ApiProperty({
    required: false,
    type: String,
    example: 'sortBy',
  })
  @IsOptional()
  @Expose()
  sortBy!: string

  @ApiProperty({
    required: false,
    type: String,
    example: 'ASC',
  })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    return value?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
  })
  direction!: string
}
