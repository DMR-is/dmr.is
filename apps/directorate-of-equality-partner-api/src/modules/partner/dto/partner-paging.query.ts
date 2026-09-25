import { IsNumber, IsOptional, Max, Min } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

import { DEFAULT_PAGE_SIZE, PAGING_MAXIMUM_PAGE_SIZE } from '@dmr.is/constants'
import { PagingQuery } from '@dmr.is/shared-dto'

/**
 * `PagingQuery` with a ceiling on `pageSize`. The shared DTO has none because
 * admin screens read whole registers through it; a public route has no such
 * caller, and an unbounded page is a single request that loads every row of a
 * large employer's outlier list.
 */
export class PartnerPagingQuery extends PagingQuery {
  @ApiProperty({
    required: false,
    type: Number,
    example: 10,
    name: 'pageSize',
    default: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: PAGING_MAXIMUM_PAGE_SIZE,
  })
  // Restated, not inherited: class-validator drops a parent's rules for a
  // property the subclass decorates, so `@Max` alone would lose `@Min(1)`.
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(PAGING_MAXIMUM_PAGE_SIZE)
  declare pageSize: number
}
