import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  useQueryStates,
} from 'nuqs'

export const useFilters = () => {
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    typeId: parseAsString,
    categoryId: parseAsArrayOf(parseAsString),
    dateFrom: parseAsIsoDate,
    dateTo: parseAsIsoDate,
    year: parseAsString.withDefault(new Date().getFullYear().toString()),
  })

  const reset = () => {
    setFilters({
      search: '',
      typeId: null,
      categoryId: null,
      dateFrom: null,
      dateTo: null,
      year: 'all',
    })
  }

  return { filters, setFilters, reset }
}
