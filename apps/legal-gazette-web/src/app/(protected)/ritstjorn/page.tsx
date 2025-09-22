import { getServerSession } from 'next-auth'

import { PageContainer } from '../../../components/client-components/ritstjorn/PageContainer'
import { getLegalGazetteClient } from '../../../lib/api/createClient'
import { authOptions } from '../../../lib/auth/authOptions'

export default async function Ritstjorn() {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('Unauthorized')
  }

  const client = getLegalGazetteClient('AdvertApi', session.idToken)

  const advertsCountData = await client.getAdvertsCount()

  return <PageContainer initalAdvertsCount={advertsCountData} />
}
