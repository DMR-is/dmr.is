import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs'

export const useFilters = () => {
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(5),
    search: parseAsString.withDefault(''),
    typeId: parseAsString,
    categoryId: parseAsArrayOf(parseAsString).withDefault([]),
    dateFrom: parseAsString,
    dateTo: parseAsString,
  })

  const reset = () => {
    setFilters({
      search: '',
      typeId: null,
      categoryId: [],
      dateFrom: null,
      dateTo: null,
    })
  }

  return { filters, setFilters, reset }
}
