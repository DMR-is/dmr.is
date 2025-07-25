'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import { IntlProvider } from 'react-intl'

import { allMessages } from '../../lib/messages'
import { flattenMessages } from '../../lib/utils'

export const Providers = ({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) => {
  return (
    <>
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
    </>
  )
}
