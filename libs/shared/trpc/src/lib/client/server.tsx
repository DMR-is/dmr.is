import { cache } from 'react'

import { handleTRPCError } from '../utils/errorHandler'
import { makeQueryClient } from './query-client'

import 'server-only' // <-- ensure this file cannot be imported from the client
import type {
  DefaultError,
  FetchQueryOptions,
  QueryKey,
} from '@tanstack/react-query'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient)

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  )
}
export function prefetch<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(queryOptions)
}

export function fetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = getQueryClient()
  return queryClient.fetchQuery(queryOptions)
}

export async function fetchQueryWithHandler<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = getQueryClient()
  try {
    const result = await queryClient.fetchQuery({
      ...queryOptions,
      retry: false,
    })
    return result
  } catch (error) {
    return handleTRPCError(error)
  }
}
