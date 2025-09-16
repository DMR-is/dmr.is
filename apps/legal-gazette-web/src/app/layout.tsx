import { getServerSession } from 'next-auth'

import { Header } from '@dmr.is/ui/components/client-components/Header/Header'

import { Providers } from '../components/providers/Providers'
import { getLegalGazetteClient } from '../lib/api/createClient'
import { authOptions } from '../lib/auth/authOptions'

import '../styles/global.css'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  const typeClient = getLegalGazetteClient('TypeApi', session?.idToken)
  const categoryClient = getLegalGazetteClient('CategoryApi', session?.idToken)
  const statusClient = getLegalGazetteClient('StatusApi', session?.idToken)

  const types = await typeClient.getTypes()
  const categories = await categoryClient.getCategories({})
  const statuses = await statusClient.getStatuses()

  return (
    <html lang="is">
      <body>
        <Providers
          session={session}
          types={types}
          categories={categories}
          statuses={statuses}
        >
          <Header variant="blue" />
          {children}
        </Providers>
      </body>
    </html>
  )
}
