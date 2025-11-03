import type { AppRouter } from '../server/routers/_app'

import {
  DefaultError,
  QueryClient,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'
import {
  useQuery as useQueryTanstack,
  useSuspenseQuery as useSuspenseQueryTanstack,
} from '@tanstack/react-query'
import { createTRPCContext } from '@trpc/tanstack-react-query'
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>()

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> {
  const result = useQueryTanstack(
    {
      ...options,
    },
    queryClient,
  )
  return result
}

export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseSuspenseQueryResult<TData, TError> {
  return useSuspenseQueryTanstack(options)
}
