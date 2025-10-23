import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/Header/Header'

import { Providers } from '../../components/providers/Providers'
import { authOptions } from '../../lib/auth/authOptions'
import { TRPCReactProvider } from '../../lib/nTrpc/client/Provider'
import { HydrateClient, prefetch, trpc } from '../../lib/nTrpc/client/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (session?.invalid) {
    redirect('/innskraning')
  }

  prefetch(trpc.getAllEntities.queryOptions())

  return (
    <TRPCReactProvider>
      <HydrateClient>
        <Providers session={session}>
          <Header variant="blue" />
          {children}
        </Providers>
      </HydrateClient>
    </TRPCReactProvider>
  )
}
