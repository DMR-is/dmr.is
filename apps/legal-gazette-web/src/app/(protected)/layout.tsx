import { Header } from '@dmr.is/ui/components/Header/Header'

import { Providers } from '../../components/providers/Providers'
import { TRPCReactProvider } from '../../lib/nTrpc/client/Provider'
import { HydrateClient, prefetch, trpc } from '../../lib/nTrpc/client/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  prefetch(trpc.getAllEntities.queryOptions())

  return (
    <TRPCReactProvider>
      <HydrateClient>
        <Providers>
          <Header variant="blue" />
          {children}
        </Providers>
      </HydrateClient>
    </TRPCReactProvider>
  )
}
