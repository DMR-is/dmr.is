import { cache } from 'react'

import { appRouter } from '../server/routers/_app'
import { createTRPCContext } from '../server/trpc'
import { makeQueryClient } from './query-client'

import 'server-only' // <-- ensure this file cannot be imported from the client
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from '@trpc/tanstack-react-query'
import { handleTRPCError } from '../utils/errorHandler'
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient)
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  )
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}

export function fetchQuery<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient()
  return queryClient.fetchQuery(queryOptions)
}

export async function fetchQueryWithHandler<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient()
  try {
  const result = await queryClient.fetchQuery({...queryOptions, retry: false})
  return result
  } catch (error) {
    handleTRPCError(error)
  }
}

export const getCaller = async () => {
  return appRouter.createCaller(await createTRPCContext())
}

