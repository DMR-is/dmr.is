import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/Header/Header'

import { Providers } from '../../components/providers/Providers'
import { authOptions } from '../../lib/auth/authOptions'
import ProviderTRPC from '../../lib/trpc/client/Provider'
import { getTrpcServer } from '../../lib/trpc/server/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  const { trpc, HydrateClient } = await getTrpcServer()

  void trpc.baseEntity.getAllEntities.prefetch()

  return (
    <ProviderTRPC>
      <HydrateClient>
        <Providers session={session}>
          <Header variant="blue" />
          {children}
        </Providers>
      </HydrateClient>
    </ProviderTRPC>
  )
}
