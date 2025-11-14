import { getServerSession } from 'next-auth'

import { Providers } from '../components/providers/Providers'
import { authOptions } from '../lib/authOptions'

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
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
