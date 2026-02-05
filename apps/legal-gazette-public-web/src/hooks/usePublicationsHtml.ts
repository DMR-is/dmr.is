import { useTRPC } from '../lib/trpc/client/trpc'
import { useFilters } from './useFilters'

import { useQuery } from '@tanstack/react-query'

type UsePublicationsHtmlOptions = {
  enable?: boolean
}

export const usePublicationsHtml = (
  options: UsePublicationsHtmlOptions = {},
) => {
  const { filters } = useFilters()
  const trpc = useTRPC()

  const { data, isLoading, error } = useQuery(
    trpc.getCombinedHTML.queryOptions(
      {
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
      },
      {
        enabled: options.enable ?? true,
      },
    ),
  )

  return { html: data?.publicationsHtml, isLoading, error }
}
