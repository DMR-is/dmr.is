import {
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'

import {
  ApplicationStatusEnum,
  ApplicationTypeEnum,
  SortDirectionEnum,
} from '../gen/fetch'

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
      type: parseAsStringEnum(Object.values(ApplicationTypeEnum)),
      status: parseAsStringEnum(Object.values(ApplicationStatusEnum)),
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
