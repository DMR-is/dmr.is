'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { ToastContainer } from '@island.is/island-ui/core'

type Props = {
  session: Session
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
