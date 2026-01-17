import { getServerSession } from 'next-auth'

import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'

import { Providers } from '../components/client-components/providers/Providers'
import { authOptions } from '../lib/authOptions'
import ProviderTRPC from '../lib/trpc/client/Provider'
import { getBaseUrlFromServerSide } from '../lib/utils'

import '../styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const baseUrl = getBaseUrlFromServerSide()

  return (
    <html lang="is">
      <body>
        <ProviderTRPC>
          <Providers session={session}>{children}</Providers>
        </ProviderTRPC>
        <LGFooter baseUrl={baseUrl} site="web" />
      </body>
    </html>
  )
}
