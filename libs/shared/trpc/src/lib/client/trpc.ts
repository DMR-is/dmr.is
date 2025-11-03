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
import { AnyTRPCRouter } from '@trpc/server'
import { createTRPCContext as createTrpcContextTanstack } from '@trpc/tanstack-react-query'
import type { CreateTRPCContextResult } from '@trpc/tanstack-react-query/src/internals/Context'

export function createTrpcContext<
  TRouter extends AnyTRPCRouter,
>(): CreateTRPCContextResult<TRouter> {
  return createTrpcContextTanstack<TRouter>()
}


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
