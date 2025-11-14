import { getServerSession } from 'next-auth'

import { RootProviders } from '../components/providers/RootProviders'
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
        <RootProviders session={session}>
          {children}
        </RootProviders>
      </body>
    </html>
  )
}
