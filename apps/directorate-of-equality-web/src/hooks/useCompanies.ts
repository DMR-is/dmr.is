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

  const { data, isLoading, isFetching } = useQuery(
    trpc.company.list.queryOptions(query, { placeholderData: (prev) => prev }),
  )

  const resetFilter = () =>
    setFilter(
      Object.fromEntries(
        Object.keys(getCompaniesParsers).map((k) => [k, null]),
      ) as Parameters<typeof setFilter>[0],
    )

  return { data, isLoading, isFetching, filter, setFilter, resetFilter }
}
