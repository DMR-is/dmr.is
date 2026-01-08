import { createSearchParamsCache, parseAsInteger } from 'nuqs/server'

export const pagingParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
}

export const pagingParamsCache = createSearchParamsCache(pagingParams)
