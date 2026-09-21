import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server'

/**
 * The URL state `UserProvider` keys its `getUsers` query on
 * (`context/userContext.tsx:77-92`).
 *
 * These must stay in step with that hook: the page prefetches with the same
 * values, and a key that does not hash equal means the awaited fetch is
 * discarded and the user waits for nothing.
 */
export const usersParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  stofnun: parseAsString,
  hlutverk: parseAsString,
  leit: parseAsString,
}

export const usersParamsCache = createSearchParamsCache(usersParams)
