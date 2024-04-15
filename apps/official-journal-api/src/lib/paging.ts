import { PAGING_DEFAULT_PAGE_SIZE } from '../dto/journal-constants.dto'
import { JournalPaging } from '../dto/journal-paging.dto'

export function generatePaging(
  count: number,
  page = 1,
  pageSize = PAGING_DEFAULT_PAGE_SIZE,
): JournalPaging {
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
