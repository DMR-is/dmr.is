import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/client-components/Header/Header'

import { Providers } from '../components/providers/Providers'
import { authOptions } from '../lib/auth/authOptions'

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
        <Providers session={session}>
          <Header variant="blue" />
          {children}
        </Providers>
      </body>
    </html>
  )
}
