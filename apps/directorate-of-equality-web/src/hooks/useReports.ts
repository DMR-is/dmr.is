'use client'
import { useQueryStates } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { listReportsParsers } from '../gen/fetch/nuqs-parsers.gen'
import { useTRPC } from '../lib/trpc/client/trpc'
import type { AppRouter } from '../lib/trpc/server/routers/_app'

import type { inferRouterInputs } from '@trpc/server'

type ListReportsInput = inferRouterInputs<AppRouter>['reports']['list']

export function useReports(fixedQuery?: Partial<ListReportsInput>) {
  const trpc = useTRPC()
  const [filter, setFilter] = useQueryStates(listReportsParsers)

  const query = Object.fromEntries(
    Object.entries({ ...filter, ...fixedQuery }).map(([k, v]) => [
      k,
      v ?? undefined,
    ]),
  )

  const { data, isLoading, isFetching } = useQuery(
    trpc.reports.list.queryOptions(query, { placeholderData: (prev) => prev }),
  )

  const resetFilter = () =>
    setFilter(
      Object.fromEntries(
        Object.keys(listReportsParsers).map((k) => [k, null]),
      ) as Parameters<typeof setFilter>[0],
    )

  return { data, isLoading, isFetching, filter, setFilter, resetFilter }
}
