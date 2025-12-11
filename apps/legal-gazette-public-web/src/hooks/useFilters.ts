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
    yearId: parseAsInteger.withDefault(new Date().getFullYear()),
    totalItems: parseAsInteger.withDefault(0),
  })

  const reset = () => {
    setFilters({
      search: '',
      typeId: null,
      categoryId: null,
      dateFrom: null,
      dateTo: null,
      yearId: null,
      totalItems: null,
    })
  }

  return { filters, setFilters, reset }
}
