import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'
import { Header } from '@dmr.is/ui/components/Header/Header'

import { trpc } from '../../lib/trpc/client/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  prefetch(trpc.getAllEntities.queryOptions())

  return (
    <HydrateClient>
      <Header variant="blue" />
      {children}
    </HydrateClient>
  )
}
