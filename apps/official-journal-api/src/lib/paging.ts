import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { Paging } from '@dmr.is/shared/dto'

export function generatePaging(
  count: number,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Paging {
  const totalPages = Math.ceil(count / pageSize)
  const totalItems = count
  const nextPage = page + 1
  const previousPage = page - 1

  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    nextPage: nextPage <= totalPages ? nextPage : null,
    previousPage: previousPage > 0 ? previousPage : null,
    hasNextPage: nextPage <= totalPages,
    hasPreviousPage: previousPage > 0,
  }
}
