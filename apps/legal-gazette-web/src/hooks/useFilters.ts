import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'next-usequerystate'

import { QueryParams } from '../lib/constants'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../lib/constants'

/**
 * Components using this hook must be dynamically imported!!
 */
export const useFilters = () => {
  const [filters, setFilters] = useQueryStates({
    [QueryParams.SEARCH]: parseAsString.withDefault(''),
    [QueryParams.STATUS]: parseAsArrayOf(parseAsString),
    [QueryParams.TYPE]: parseAsArrayOf(parseAsString),
    [QueryParams.CATEGORY]: parseAsArrayOf(parseAsString),
    [QueryParams.PUBLICATION]: parseAsArrayOf(parseAsString),
    [QueryParams.PAGE]: parseAsInteger.withDefault(DEFAULT_PAGE),
    [QueryParams.PAGE_SIZE]: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
    [QueryParams.SORT_BY]: parseAsString,
    [QueryParams.DIRECTION]: parseAsString,
  })

  const setParams = (...params: Parameters<typeof setFilters>) => {
    const incomingParams = params[0] as object | null

    if (incomingParams === null) {
      return setFilters(incomingParams)
    }

    Object.entries(incomingParams).forEach(([key, value]) => {
      if (Array.isArray(value) && !value.length) {
        Object.assign(incomingParams, { [key]: null })
      }
    })

    setFilters(incomingParams)
  }

  return {
    params: filters,
    setParams,
  }
}
