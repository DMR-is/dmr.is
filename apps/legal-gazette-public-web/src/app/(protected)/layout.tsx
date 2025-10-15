import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/client-components/Header/Header'

import { Providers } from '../../components/client-components/providers/Providers'
import { authOptions } from '../../lib/authOptions'
import ProviderTRPC from '../../lib/trpc/client/Provider'

import '../../styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  return (
    <ProviderTRPC>
      <html lang="is">
        <body>
          <Providers session={session}>
            <Header />
            {children}
          </Providers>
        </body>
      </html>
    </ProviderTRPC>
  )
}
