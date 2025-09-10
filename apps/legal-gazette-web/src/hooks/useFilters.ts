import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  UseQueryStateOptions,
  useQueryStates,
} from 'nuqs'

import { QueryParams } from '../lib/constants'

type Props = {
  options?: UseQueryStateOptions<QueryParams>
}

export const useFilters = ({ options }: Props = {}) => {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(10),
      categoryId: parseAsArrayOf(parseAsString).withDefault([]),
      typeId: parseAsArrayOf(parseAsString).withDefault([]),
      dateFrom: parseAsIsoDate,
      dateTo: parseAsIsoDate,
      sortBy: parseAsString,
      direction: parseAsStringEnum(['asc', 'desc']).withDefault('desc'),
    },
    {
      ...options,
      clearOnDefault: true,
      urlKeys: {
        categoryId: 'category',
        typeId: 'type',
      },
    },
  )

  return {
    params: searchParams,
    setParams: setSearchParams,
  }
}
