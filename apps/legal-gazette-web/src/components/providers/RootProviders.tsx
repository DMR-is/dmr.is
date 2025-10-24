'use client'

import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

export const RootProviders = ({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) => {
  return (
    <SessionProvider
      session={session}
      refetchInterval={1 * 60}
      refetchOnWindowFocus={true}
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  )
}
