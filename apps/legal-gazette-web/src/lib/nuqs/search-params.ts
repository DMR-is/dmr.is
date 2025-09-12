import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'

export const serverSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  sortBy: parseAsString,
  direction: parseAsStringEnum(['asc', 'desc'] as const).withDefault('desc'),
}

export const loadSearchParams = createLoader(serverSearchParams)
