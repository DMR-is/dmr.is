'use client'
import React, { useState } from 'react'

import { makeQueryClient } from '@dmr.is/trpc/client/query-client'

import { getBaseUrlFromServerSide } from '../../utils'
import { AppRouter } from '../server/routers/_app'
import { TRPCProvider } from './trpc'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
} from '@trpc/client'

let clientQueryClientSingleton: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient())
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  return getBaseUrlFromServerSide(true)// dev SSR should use localhost
}
function getUrl() {
  const base = getBaseUrl()
  return `${base}/api/trpc`
}

export default function ProviderTRPC({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition(op) {
            return op.path === 'getUser'
          },
          true: httpLink({ url: getUrl() }),
          false: httpBatchLink({ url: getUrl() }),
        }),
      ],
    }),
  )
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TRPCProvider>
  )
}
