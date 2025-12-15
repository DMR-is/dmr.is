import { useTRPC } from '../lib/trpc/client/trpc'
import { useFilters } from './useFilters'

import { useQuery } from '@tanstack/react-query'

export const useIssues = () => {
  const { filters } = useFilters()
  const trpc = useTRPC()

  const { data, isLoading } = useQuery(
    trpc.getIssues.queryOptions({
      page: filters.page,
      pageSize: filters.pageSize,
      year:
        filters.dateFrom && filters.dateTo
          ? undefined
          : filters?.year === 'all' || filters?.year === 'allt'
            ? undefined
            : filters.year?.toString(),
      dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : undefined,
      dateTo: filters.dateTo ? filters.dateTo.toISOString() : undefined,
    }),
  )

  const totalItems = data?.paging.totalItems || 0

  return { data, isLoading, totalItems }
}
