import {
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  useQueryStates,
} from 'nuqs'

export const useFilters = () => {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(10),
      categoryId: parseAsString,
      typeId: parseAsString,
      dateFrom: parseAsIsoDate,
      dateTo: parseAsIsoDate,
    },
    {
      history: 'replace',
      scroll: false,
      shallow: true,
    },
  )

  return {
    params: searchParams,
    setParams: setSearchParams,
  }
}
