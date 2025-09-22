import { getServerSession } from 'next-auth'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { HeaderNoAuth } from '@dmr.is/ui/components/HeaderNoAuth/HeaderNoAuth'

import { Providers } from '../../components/client-components/providers/Providers'

import '../styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  return (
    <html lang="is">
      <body>
        <NuqsAdapter>
          <Providers session={session}>
            <HeaderNoAuth variant="white" />
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}
