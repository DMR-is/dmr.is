import { getServerSession } from 'next-auth'

import { Providers } from '../components/providers/Providers'
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
      </body>
    </html>
  )
}
