import { Expose, Transform } from 'class-transformer'
import { IsOptional } from 'class-validator'
import {
  DEFAULT_CASE_SORT_BY,
  DEFAULT_CASE_SORT_DIRECTION,
} from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class SortingQuery {
  @ApiProperty({
    required: false,
    type: String,
    example: 'sortBy',
  })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    return value ?? DEFAULT_CASE_SORT_BY
  })
  sortBy!: string

  @ApiProperty({
    required: false,
    type: String,
    example: 'ASC',
  })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    return value?.toUpperCase() === 'DESC' ? 'DESC' : DEFAULT_CASE_SORT_DIRECTION
  })
  direction!: string
}
