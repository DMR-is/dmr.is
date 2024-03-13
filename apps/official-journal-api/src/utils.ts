import { DEFAULT_PAGE_SIZE } from './constants'
import { JournalPaging } from './dto/journal-paging.dto'

export function generatePaging(
  data: unknown[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): JournalPaging {
  const totalPages = Math.ceil(data.length / pageSize)
  const totalItems = data.length
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
