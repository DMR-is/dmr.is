import { getServerSession } from 'next-auth'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { Header } from '@dmr.is/ui/components/Header/Header'

import { Providers } from '../../components/providers/Providers'
import { authOptions } from '../../lib/authOptions'
import ProviderTRPC from '../../lib/trpc/client/Provider'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <ProviderTRPC>
      <NuqsAdapter>
        <Providers session={session}>
          <Header variant="white" />
          {children}
        </Providers>
      </NuqsAdapter>
    </ProviderTRPC>
  )
}
