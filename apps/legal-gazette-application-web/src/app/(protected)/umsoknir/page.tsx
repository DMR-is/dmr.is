import { getServerSession } from 'next-auth'

import { ApplicationList } from '../../../components/client-components/application/ApplicationList'
import { UmsoknirHero } from '../../../components/client-components/hero/UmsoknirHero'
import { authOptions } from '../../../lib/authOptions'
import { getClient } from '../../../lib/createClient'
import { loadPagingSearchParams } from '../../../lib/nuqs/search-params'

export default async function UmsoknirPage({
  searchParams,
}: {
  searchParams: { page?: string; pageSize?: string }
}) {
  const { page, pageSize } = loadPagingSearchParams(searchParams)
  const session = await getServerSession(authOptions)

  if (!session || !session.idToken) {
    throw new Error('Þú þarft að vera innskráð/ur til að skoða þessa síðu.')
  }

  const client = getClient(session.idToken)

  const data = await client.getMyApplications({ page, pageSize })

  return (
    <>
      <UmsoknirHero />
      <ApplicationList applications={data.applications} />
    </>
  )
}
