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
} from './constants'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from './constants'

type UseFiltersParams = {
  initialPageSize?: number
  initialPage?: number
  initialStatus?: string[]
  initialType?: string[]
  initialCategory?: string[]
  initialPublication?: string[]
  initialSortBy?: string
  initialDirection?: SortDirection
  initialDepartment?: string[]
}

/**
 * Components using this hook must be dynamically imported!!
 */
export const useFilters = ({ initialPageSize, initialPage, initialStatus, initialType, initialCategory, initialPublication, initialSortBy, initialDirection, initialDepartment }: UseFiltersParams = {}) => {
  const [filters, setFilters] = useQueryStates({
    [QueryParams.SEARCH]: parseAsString.withDefault(''),
    [QueryParams.STATUS]: parseAsArrayOf(parseAsString).withDefault(initialStatus ?? []),
    [QueryParams.TYPE]: parseAsArrayOf(parseAsString).withDefault(initialType ?? []),
    [QueryParams.CATEGORY]: parseAsArrayOf(parseAsString).withDefault(initialCategory ?? []),
    [QueryParams.PUBLICATION]: parseAsArrayOf(parseAsString).withDefault(initialPublication ?? []),
    [QueryParams.PAGE]: parseAsInteger.withDefault(initialPage ?? DEFAULT_PAGE),
    [QueryParams.PAGE_SIZE]: parseAsInteger.withDefault(initialPageSize ?? DEFAULT_PAGE_SIZE),
    [QueryParams.SORT_BY]: parseAsString.withDefault(initialSortBy ?? ''),
    [QueryParams.DIRECTION]: parseAsStringEnum<SortDirection>(
      Object.values(SortDirection),
    ).withDefault(initialDirection ?? DEFAULT_SORT_DIRECTION),
    [QueryParams.DEPARTMENT]: parseAsArrayOf(parseAsString).withDefault(initialDepartment ?? []),
  })

  const setParams = (...params: Parameters<typeof setFilters>) => {
    const incomingParams = params[0] as object | null

    if (incomingParams === null) {
      return setFilters(incomingParams)
    }

    // If incoming params contains any keys that are not page we want to reset the page
    // To reset page when sorting or filtering
    if (Object.keys(incomingParams).some((key) => key !== QueryParams.PAGE)) {
      Object.assign(incomingParams, { [QueryParams.PAGE]: DEFAULT_PAGE })
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

  const resetFilters = () => {
    setParams({
      [QueryParams.SEARCH]: '',
      [QueryParams.STATUS]: [],
      [QueryParams.TYPE]: [],
      [QueryParams.CATEGORY]: [],
      [QueryParams.PUBLICATION]: [],
      [QueryParams.SORT_BY]: null,
      [QueryParams.DIRECTION]: DEFAULT_SORT_DIRECTION,
      [QueryParams.DEPARTMENT]: [],
    })
  }

  const activeFilters = Object.entries(filters).reduce(
    (acc, [key, value]) => {
      if (!FILTERS_TO_SHOW.includes(key as QueryParams)) {
        return acc
      }
      acc.push([key as QueryParams, value as string[]])
      return acc
    },
    [] as [QueryParams, string[]][],
  )

  return {
    params: filters,
    activeFilters,
    setParams,
    resetFilters,
  }
}
