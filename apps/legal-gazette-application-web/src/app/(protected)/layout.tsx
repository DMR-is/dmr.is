import { getServerSession } from 'next-auth'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { Header } from '@dmr.is/ui/components/Header/Header'

import { Providers } from '../../components/client-components/providers/Providers'
import { authOptions } from '../../lib/authOptions'
import ProviderTRPC from '../../lib/trpc/client/Provider'
import { getTrpcServer } from '../../lib/trpc/server/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const { trpc, HydrateClient } = await getTrpcServer()

  void trpc.baseEntity.getAllEntities.prefetch()

  return (
    <ProviderTRPC>
      <HydrateClient>
        <NuqsAdapter>
          <Providers session={session}>
            <Header variant="white" />
            {children}
          </Providers>
        </NuqsAdapter>
      </HydrateClient>
    </ProviderTRPC>
  )
}
