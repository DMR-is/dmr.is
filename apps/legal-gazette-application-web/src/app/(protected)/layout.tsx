import { getServerSession } from 'next-auth'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { Header } from '@dmr.is/ui/components/Header/Header'

import { Providers } from '../../components/client-components/providers/Providers'

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
            <Header variant="white" />
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}
