'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { ToastContainer } from '@dmr.is/ui/components/island-is'

type Props = {
  session: Session | null
  children?: React.ReactNode
}

export const Providers = ({ session, children }: Props) => {
  return (
    <SessionProvider session={session}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <ToastContainer />
    </SessionProvider>
  )
}
