import { getServerSession } from 'next-auth'

import { LGFooter } from '@dmr.is/ui/components/Footer/LGFooter'

import { Providers } from '../components/client-components/providers/Providers'
import { authOptions } from '../lib/authOptions'
import ProviderTRPC from '../lib/trpc/client/Provider'

import '../styles/global.css'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

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
          <ReactQueryDevtools />
        </ProviderTRPC>
        <LGFooter site="web" />
      </body>
    </html>
  )
}
