import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/client-components/Header/Header'

import { Providers } from '../components/client-components/providers/Providers'
import { authOptions } from '../lib/authOptions'
import ProviderTRPC from '../lib/trpc/client/Provider'

import '../styles/global.css'

export default async function RootLayout({
  unauthenticated,
  authenticated,
}: {
  unauthenticated: React.ReactNode
  authenticated: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  console.log(authenticated)

  return (
    <ProviderTRPC>
      <html lang="is">
        <body>
          <Providers session={session}>
            {session ? authenticated : unauthenticated}
          </Providers>
        </body>
      </html>
    </ProviderTRPC>
  )
}
