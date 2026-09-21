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
/**
 * Primes the server query cache for a client component to hydrate from.
 *
 * Leaving the returned promise unawaited streams the page out before the data
 * lands, which only works when the consumer renders through `useSuspenseQuery`.
 * A consumer branching on `useQuery`'s `isPending` must await this, or the
 * server renders the pending branch while the client hydrates the resolved one
 * and React throws away the whole tree on a hydration mismatch.
 *
 * When you do await it, give the route a `loading.tsx` - the render now blocks,
 * so a client-side navigation shows nothing until the query answers. Note also
 * that `retry: false` bounds the number of attempts, not the wall-clock wait: a
 * slow-but-alive API still stalls the render.
 */
export function prefetch<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = getQueryClient()

  return queryClient.prefetchQuery(queryOptions)
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
