import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'

import { NotFoundException } from '@nestjs/common'
export function generatePaging(
  data: unknown[],
  page: number | undefined = 1,
  pageSize: number | undefined = DEFAULT_PAGE_SIZE,
) {
  const totalPages = Math.ceil(data.length / pageSize)
  const totalItems = data.length
  const nextPage = page + 1
  const previousPage = page - 1

  if (page > pageSize) {
    throw new NotFoundException('Page out of range', {
      cause: 'Page out of range',
    })
  }

  return {
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages,
    totalItems,
    nextPage: nextPage <= totalPages ? nextPage : null,
    previousPage: previousPage > 0 ? previousPage : null,
    hasNextPage: nextPage <= totalPages,
    hasPreviousPage: previousPage > 0,
  }
}
