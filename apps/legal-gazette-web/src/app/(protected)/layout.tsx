import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'
import { Header } from '@dmr.is/ui/components/Header/Header'

import { Providers } from '../../components/providers/Providers'
import { trpc } from '../../lib/trpc/client/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  prefetch(trpc.getAllEntities.queryOptions())

  return (
    <HydrateClient>
      <Providers>
        <Header variant="blue" />
        {children}
      </Providers>
    </HydrateClient>
  )
}
