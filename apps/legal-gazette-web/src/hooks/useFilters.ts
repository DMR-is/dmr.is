import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'next-usequerystate'

import {
  DEFAULT_SORT_DIRECTION,
  FILTERS_TO_SHOW,
  QueryParams,
  SortDirection,
} from '../lib/constants'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../lib/constants'

/**
 * Components using this hook must be dynamically imported!!
 */
export const useFilters = () => {
  const [filters, setFilters] = useQueryStates({
    [QueryParams.SEARCH]: parseAsString.withDefault(''),
    [QueryParams.STATUS]: parseAsArrayOf(parseAsString).withDefault([]),
    [QueryParams.TYPE]: parseAsArrayOf(parseAsString).withDefault([]),
    [QueryParams.CATEGORY]: parseAsArrayOf(parseAsString).withDefault([]),
    [QueryParams.PUBLICATION]: parseAsArrayOf(parseAsString).withDefault([]),
    [QueryParams.PAGE]: parseAsInteger.withDefault(DEFAULT_PAGE),
    [QueryParams.PAGE_SIZE]: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
    [QueryParams.SORT_BY]: parseAsString,
    [QueryParams.DIRECTION]: parseAsStringEnum<SortDirection>(
      Object.values(SortDirection),
    ).withDefault(DEFAULT_SORT_DIRECTION),
  })

  const setParams = (...params: Parameters<typeof setFilters>) => {
    const incomingParams = params[0] as object | null

    if (incomingParams === null) {
      return setFilters(incomingParams)
    }

    Object.entries(incomingParams).forEach(([key, value]) => {
      if (typeof value === 'string' && !value) {
        Object.assign(incomingParams, { [key]: null })
      }
      if (Array.isArray(value) && !value.length) {
        Object.assign(incomingParams, { [key]: null })
      }
    })

    setFilters(incomingParams)
  }

  const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (!FILTERS_TO_SHOW.includes(key as QueryParams)) {
      return acc
    }
    acc.push([key as QueryParams, value as string[]])
    return acc
  }, [] as [QueryParams, string[]][])

  return {
    params: filters,
    activeFilters,
    setParams,
  }
}
