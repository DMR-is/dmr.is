import { createLoader, parseAsInteger } from 'nuqs/server'

export const pagingSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
}

export const loadPagingSearchParams = createLoader(pagingSearchParams)
