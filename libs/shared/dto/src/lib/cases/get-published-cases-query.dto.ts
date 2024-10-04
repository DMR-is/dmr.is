import { Expose, Transform } from 'class-transformer'
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  PAGING_MAXIMUM_PAGE_SIZE,
} from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class GetPublishedCasesQuery {
  @ApiProperty({
    description: 'Page number',
    type: Number,
    required: false,
    default: 1,
  })
  @Expose()
  @Transform(({ value }) => (value ? value : DEFAULT_PAGE_NUMBER))
  page!: number

  @ApiProperty({
    description: 'Page size',
    type: Number,
    required: false,
    default: DEFAULT_PAGE_SIZE,
  })
  @Expose()
  @Transform(({ value }) => {
    if (!value || value < 1) {
      return DEFAULT_PAGE_SIZE
    }

    if (value > PAGING_MAXIMUM_PAGE_SIZE) {
      return PAGING_MAXIMUM_PAGE_SIZE
    }

    return value
  })
  pageSize!: number
}
