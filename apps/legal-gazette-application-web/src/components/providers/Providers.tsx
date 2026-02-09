'use client'
import { SessionProvider } from 'next-auth/react'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { ToastContainer } from '@dmr.is/ui/components/island-is/ToastContainer'

type Props = React.ComponentProps<typeof SessionProvider>

export const Providers = ({ children, session }: Props) => {
  return (
    <SessionProvider session={session}>
      <NuqsAdapter>{children}</NuqsAdapter>
      <ToastContainer />
    </SessionProvider>
  )
}
