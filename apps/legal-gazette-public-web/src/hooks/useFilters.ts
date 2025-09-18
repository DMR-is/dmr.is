import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

export const useFilters = () => {
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    categoryId: parseAsArrayOf(parseAsString).withDefault([]),
    typeId: parseAsArrayOf(parseAsString).withDefault([]),
    dateFrom: parseAsString,
    dateTo: parseAsString,
  })

  const reset = () => {
    setFilters({
      search: '',
      categoryId: [],
      typeId: [],
      dateFrom: null,
      dateTo: null,
    })
  }

  return { filters, setFilters, reset }
}
