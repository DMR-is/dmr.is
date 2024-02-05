import { ApiProperty } from '@nestjs/swagger'
import { PAGING_MAXIMUM_PAGE_SIZE } from './journal-constants.dto'

export class JournalPaging {
  @ApiProperty({ example: 1 })
  page!: number

  @ApiProperty({ example: 10 })
  totalPages!: number

  @ApiProperty({ example: 1000 })
  totalItems!: number

  @ApiProperty({ example: 2, nullable: true })
  nextPage!: number | null

  @ApiProperty({ example: 1, nullable: true })
  previousPage!: number | null

  @ApiProperty({ example: 10, minimum: 1, maximum: PAGING_MAXIMUM_PAGE_SIZE })
  pageSize!: number

  @ApiProperty({ example: true })
  hasNextPage!: boolean

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean | null
}
