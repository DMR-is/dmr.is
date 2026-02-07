'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import { NuqsAdapter } from 'nuqs/adapters/next'
import { IntlProvider } from 'react-intl'

import { ToastContainer } from '@dmr.is/ui/components/island-is/ToastContainer'

import { allMessages } from '../../lib/messages'
import { TRPCReactProvider } from '../../lib/trpc/client/Provider'
import { flattenMessages } from '../../lib/utils'

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
          <IntlProvider
            locale="is"
            defaultLocale="is"
            messages={flattenMessages(allMessages)}
            onError={(err) => {
              // Chrome only ships with 'en' formatters for NumberFormat and DateTimeFormat.
              // Ignore these errors since we're not using these formatters.
              // Bundling polyfills for 'is' significantly increases bundle size and provides no gain.
              // See: https://app.asana.com/0/1202453499137756/1204509391926816
              if (err.code === 'MISSING_DATA') {
                return null
              }

              // eslint-disable-next-line no-console
              console.error('Error in IntlProvider', { exception: err })
            }}
          >
            {children}
          </IntlProvider>
        </SessionProvider>
      </NuqsAdapter>
      <ToastContainer closeButton={true} timeout={2000} />
      <ReactQueryDevtools />
    </TRPCReactProvider>
  )
}
