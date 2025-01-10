import { Expose, Transform } from 'class-transformer'
import { isNumberString, isString } from 'class-validator'
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  PAGING_MAXIMUM_PAGE_SIZE,
} from '@dmr.is/constants'

import { ApiProperty } from '@nestjs/swagger'

export class GetPublishedCasesQuery {
  @ApiProperty({
    name: 'page',
    description: 'Page number',
    type: Number,
    required: false,
    default: 1,
  })
  @Expose()
  @Transform(({ value }) => {
    if (!isNumberString(value)) {
      return DEFAULT_PAGE_NUMBER
    }

    return parseInt(value)
  })
  page!: number

  @ApiProperty({
    name: 'search',
    type: String,
    description: 'Search for advert title',
    required: false,
    default: '',
  })
  @Expose()
  @Transform(({ value }) => {
    if (!isString(value)) {
      return ''
    }
    return value
  })
  search!: string

  @ApiProperty({
    type: Number,
    name: 'pageSize',
    description: 'Page size',
    required: false,
    default: DEFAULT_PAGE_SIZE,
  })
  @Expose()
  @Transform(({ value }) => {
    if (!isNumberString(value)) {
      return DEFAULT_PAGE_SIZE
    }

    const val = parseInt(value)

    if (val < 1) {
      return DEFAULT_PAGE_SIZE
    }

    if (val > PAGING_MAXIMUM_PAGE_SIZE) {
      return PAGING_MAXIMUM_PAGE_SIZE
    }

    return val
  })
  pageSize!: number
}
