import { Expose, Transform } from 'class-transformer'
import { IsNumber, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'

export class PagingQuery {
  @ApiProperty({
    required: false,
    type: Number,
    example: 1,
    name: 'page',
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Transform(({ value }) => {
    const val = value ? parseInt(value) : DEFAULT_PAGE_NUMBER
    if (Number.isNaN(val)) {
      return DEFAULT_PAGE_NUMBER
    }

    return val
  })
  page!: number

  @ApiProperty({
    required: false,
    type: Number,
    example: 10,
    name: 'pageSize',
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Transform(({ value }) => {
    const val = value ? parseInt(value) : DEFAULT_PAGE_SIZE
    if (Number.isNaN(val)) {
      return DEFAULT_PAGE_NUMBER
    }

    return val
  })
  pageSize!: number
}
