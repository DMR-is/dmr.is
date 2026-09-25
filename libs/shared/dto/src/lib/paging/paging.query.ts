import { Expose, Transform } from 'class-transformer'
import { IsNumber, IsOptional, Min } from 'class-validator'
import * as z from 'zod'

import { ApiProperty } from '@nestjs/swagger'

import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'

export class PagingQuery {
  @ApiProperty({
    required: false,
    type: Number,
    example: 1,
    name: 'page',
    default: DEFAULT_PAGE_NUMBER,
  })
  @IsOptional()
  @IsNumber()
  // A page before the first is an offset below zero. Refused rather than
  // clamped, so a caller's off-by-one surfaces instead of quietly reading page 1.
  @Min(1)
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
    default: DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @IsNumber()
  // pageSize=0 answered an empty page with `totalPages: null` and a `nextPage`
  // that led nowhere. No upper bound here: several admin screens read whole
  // registers through this DTO (see useAllCompanies in directorate-of-equality-web),
  // so a ceiling belongs on the routes that want one.
  @Min(1)
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

export const pagingInput = z.object({
  page: z.number().min(1).optional().default(DEFAULT_PAGE_NUMBER),
  pageSize: z.number().min(1).max(100).optional().default(DEFAULT_PAGE_SIZE),
})
