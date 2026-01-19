import { getServerSession } from 'next-auth'

import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'

import { Providers } from '../components/client-components/providers/Providers'
import { authOptions } from '../lib/authOptions'
import ProviderTRPC from '../lib/trpc/client/Provider'

import '../styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="is">
      <body>
        <ProviderTRPC>
          <Providers session={session}>{children}</Providers>
        </ProviderTRPC>
        <LGFooter site="web" />
      </body>
    </html>
  )
}
