import {
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'

import { SortDirectionEnum } from '../gen/fetch'

// URL-friendly slug values for type and status filters
const TYPE_SLUGS = [
  'almenn-auglysing',
  'innkollun-throtabus',
  'innkollun-danarbus',
] as const

const STATUS_SLUGS = ['drog', 'i-vinnslu', 'innsent', 'lokid'] as const

export const useApplicationFilters = () => {
  const [params, setParams] = useQueryStates(
    {
      search: parseAsString,
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(5),
      sortBy: parseAsString,
      direction: parseAsStringEnum(Object.values(SortDirectionEnum)),
      dateFrom: parseAsIsoDate,
      dateTo: parseAsIsoDate,
      type: parseAsStringEnum(TYPE_SLUGS),
      status: parseAsStringEnum(STATUS_SLUGS),
    },
    {
      shallow: true,
      clearOnDefault: true,
    },
  )

  const resetFilters = () => {
    setParams({
      search: null,
      page: 1,
      pageSize: 5,
      sortBy: null,
      direction: null,
      dateFrom: null,
      dateTo: null,
      type: null,
      status: null,
    })
  }

  const updateParams = (newParams: Partial<typeof params>) => {
    if (newParams.page === undefined) {
      newParams.page = 1
    }

    setParams((prev) => ({
      ...prev,
      ...newParams,
    }))
  }

  return { params, updateParams, resetFilters }
}
