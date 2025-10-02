'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import { NuqsAdapter } from 'nuqs/adapters/next'
import { IntlProvider } from 'react-intl'

import { ToastContainer } from '@dmr.is/ui/components/island-is'

import { FilterProvider } from '../../context/filter-context'
import { GetCategoriesDto, GetStatusesDto, GetTypesDto } from '../../gen/fetch'
import { allMessages } from '../../lib/messages'
import { flattenMessages } from '../../lib/utils'

export const Providers = ({
  children,
  session,
  types,
  statuses,
  categories,
}: {
  children: React.ReactNode
  session: Session | null
  types: GetTypesDto
  statuses: GetStatusesDto
  categories: GetCategoriesDto
}) => {
  return (
    <>
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
            <FilterProvider
              categories={categories}
              types={types}
              statuses={statuses}
            >
              {children}
            </FilterProvider>
          </IntlProvider>
        </SessionProvider>
      </NuqsAdapter>
      <ToastContainer closeButton={true} timeout={2000} />
    </>
  )
}
