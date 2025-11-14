'use client'
import { SessionProvider } from 'next-auth/react'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { ToastContainer } from '@dmr.is/ui/components/island-is'

import ProviderTRPC from '../../lib/trpc/client/Provider'

type Props = React.ComponentProps<typeof SessionProvider>

export const Providers = ({ children, session }: Props) => {
  return (
    <>
      <ProviderTRPC>
        <NuqsAdapter>
          <SessionProvider session={session}>{children}</SessionProvider>
          <ToastContainer />
        </NuqsAdapter>
      </ProviderTRPC>
    </>
  )
}
