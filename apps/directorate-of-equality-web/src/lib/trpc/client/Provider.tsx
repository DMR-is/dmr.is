'use client'
import { useState } from 'react'

import { makeQueryClient } from '@dmr.is/trpc/client/query-client'

import { getBaseUrlFromServerSide } from '../../utils'
import type { AppRouter } from '../server/routers/_app'
import { TRPCProvider } from './trpc'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'

let clientQueryClientSingleton: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  return (clientQueryClientSingleton ??= makeQueryClient())
}
function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return getBaseUrlFromServerSide(true)
}
function getUrl() {
  const base = getBaseUrl()
  return `${base}/api/trpc`
}
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getUrl(),
        }),
      ],
    }),
  )
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </TRPCProvider>
  )
}
