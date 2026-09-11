'use client'
import { useQueryStates } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { getCompaniesParsers } from '../gen/fetch/nuqs-parsers.gen'
import { useTRPC } from '../lib/trpc/client/trpc'
import type { AppRouter } from '../lib/trpc/server/routers/_app'

import type { inferRouterInputs } from '@trpc/server'

type GetCompaniesInput = inferRouterInputs<AppRouter>['company']['list']

export function useCompanies(fixedQuery?: Partial<GetCompaniesInput>) {
  const trpc = useTRPC()
  const [filter, setFilter] = useQueryStates(getCompaniesParsers)

  const activeFilter = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== null),
  )

  const query = Object.fromEntries(
    Object.entries({ ...activeFilter, ...fixedQuery }).map(([k, v]) => [
      k,
      v ?? undefined,
    ]),
  )

  const { data, isLoading, isFetching, isError } = useQuery(
    trpc.company.list.queryOptions(query, {
      placeholderData: (prev) => prev,
      staleTime: 5_000,
      gcTime: 5_000,
    }),
  )

  const resetFilter = () =>
    setFilter(
      Object.fromEntries(
        Object.keys(getCompaniesParsers).map((k) => [k, null]),
      ) as Parameters<typeof setFilter>[0],
    )

  /**
   * The filter as the server sees it, minus paging. The other consumer is "send
   * an email to everyone matching this filter", where `page`/`pageSize` are
   * ignored but would still land in the batch's audit snapshot, reading as
   * though the send had been limited to a page.
   */
  const { page: _page, pageSize: _pageSize, ...recipientFilter } = activeFilter

  return {
    data,
    isLoading,
    isFetching,
    isError,
    filter,
    setFilter,
    resetFilter,
    recipientFilter,
  }
}
