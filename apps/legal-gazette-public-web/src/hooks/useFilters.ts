import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'

import { AdvertVersionEnum } from '../gen/fetch'

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
    version: parseAsStringEnum(Object.values(AdvertVersionEnum)),
  })

  const reset = () => {
    setFilters({
      search: '',
      typeId: null,
      categoryId: null,
      dateFrom: null,
      dateTo: null,
      year: 'all',
      version: null,
    })
  }

  return { filters, setFilters, reset }
}
