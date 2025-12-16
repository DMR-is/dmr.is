import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'
import { Header } from '@dmr.is/ui/components/Header/Header'
import { Box } from '@dmr.is/ui/components/island-is'

import { SettingsButton } from '../../components/buttons/SettingsButton'
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
        <Header
          variant="blue"
          settings={
            <Box marginRight={2}>
              <SettingsButton />
            </Box>
          }
        />
        {children}
      </Providers>
    </HydrateClient>
  )
}
