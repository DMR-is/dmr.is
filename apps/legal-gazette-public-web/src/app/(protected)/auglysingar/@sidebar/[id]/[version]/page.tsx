import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { PublicationSidebar } from '../../../../../../components/client-components/detailed-page/Sidebar/PublicationSidebar'
import { GetAdvertPublicationVersionEnum } from '../../../../../../gen/fetch'
import { authOptions } from '../../../../../../lib/authOptions'
import { getClient } from '../../../../../../lib/createClient'

export default async function AdvertPageSidebar({
  params,
}: {
  params: { id: string; version: string }
}) {
  const session = await getServerSession(authOptions)
  const versions = ['a', 'b', 'c', 'A', 'B', 'C']

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  const client = getClient(session.idToken)

  if (!params.version || !versions.includes(params.version)) {
    return notFound()
  }

  try {
    const publication = await client.getAdvertPublication({
      advertId: params.id,
      version:
        params.version.toUpperCase() as unknown as GetAdvertPublicationVersionEnum,
    })

    return <PublicationSidebar publication={publication} />
  } catch (error) {
    return notFound()
  }
}
