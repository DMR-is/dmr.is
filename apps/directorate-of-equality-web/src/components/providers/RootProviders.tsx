'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import { NuqsAdapter } from 'nuqs/adapters/next'

import { ToastContainer } from '@dmr.is/ui/components/island-is/ToastContainer'

import { TRPCReactProvider } from '../../lib/trpc/client/Provider'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export const RootProviders = ({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) => {
  return (
    <TRPCReactProvider>
      <NuqsAdapter>
        <SessionProvider
          session={session}
          refetchInterval={1 * 60}
          refetchOnWindowFocus={true}
          basePath="/api/auth"
        >
          {children}
        </SessionProvider>
      </NuqsAdapter>
      <ToastContainer closeButton={true} timeout={2000} />
      <ReactQueryDevtools />
    </TRPCReactProvider>
  )
}
