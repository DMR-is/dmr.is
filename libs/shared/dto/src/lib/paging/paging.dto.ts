import { PAGING_MAXIMUM_PAGE_SIZE } from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class Paging {
  @ApiProperty({ type: Number, example: 1 })
  page!: number

  @ApiProperty({ type: Number, example: 10 })
  totalPages!: number

  @ApiProperty({ type: Number, example: 1000 })
  totalItems!: number

  @ApiProperty({ type: Number, example: 2, nullable: true })
  nextPage!: number | null

  @ApiProperty({ type: Number, example: 1, nullable: true })
  previousPage!: number | null

  @ApiProperty({
    type: Number,
    example: 10,
    minimum: 1,
    maximum: PAGING_MAXIMUM_PAGE_SIZE,
  })
  pageSize!: number

  @ApiProperty({ type: Boolean, example: true })
  hasNextPage!: boolean

  @ApiProperty({ type: Boolean, example: false })
  hasPreviousPage!: boolean | null
}
