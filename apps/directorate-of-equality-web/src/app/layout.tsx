import { getServerSession } from 'next-auth'

import { globalStyles } from '@dmr.is/ui/globalStyles'

import { RootProviders } from '../components/providers/RootProviders'
import { authOptions } from '../lib/auth/authOptions'

import './global.css'

globalStyles()

export const metadata = {
  title: 'Jafnréttisstofa',
  description: 'Kerfi Jafnréttisstofu',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="is">
      <body>
        <RootProviders session={session}>{children}</RootProviders>
      </body>
    </html>
  )
}
