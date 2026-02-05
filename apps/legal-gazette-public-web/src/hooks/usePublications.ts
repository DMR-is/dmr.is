import { useTRPC } from '../lib/trpc/client/trpc'
import { useFilters } from './useFilters'

import { useQuery } from '@tanstack/react-query'

export const usePublications = () => {
  const { filters } = useFilters()
  const trpc = useTRPC()

  const { data, isLoading, error } = useQuery(
    trpc.getPublications.queryOptions({
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search,
      categoryId: filters.categoryId ?? undefined,
      typeId: filters.typeId ?? undefined,
      dateFrom: filters.dateFrom
        ? new Date(filters.dateFrom).toISOString()
        : undefined,
      dateTo: filters.dateTo
        ? new Date(filters.dateTo).toISOString()
        : undefined,
    }),
  )

  const totalItems = data?.paging.totalItems || 0

  return { data, isLoading, error, totalItems }
}
