import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { Stack, Text } from '@dmr.is/ui/components/island-is'

import { GetAdvertPublicationVersionEnum } from '../../../../../gen/fetch'
import { authOptions } from '../../../../../lib/authOptions'
import { getClient } from '../../../../../lib/createClient'

export default async function AdvertPage({
  params,
}: {
  params: { id: string; version: GetAdvertPublicationVersionEnum }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  const client = getClient(session.idToken)

  try {
    const pub = await client.getAdvertPublication({
      advertId: params.id,
      version:
        params.version.toUpperCase() as unknown as GetAdvertPublicationVersionEnum,
    })

    const title = pub.publication.isLegacy
      ? `${pub.advert.type.title} - ${pub.advert.title}`
      : pub.advert.title

    return (
      <Stack space={[2, 3]}>
        <Text variant="h3">{title}</Text>
        <AdvertDisplay html={pub.html} withStyles={pub.publication.isLegacy} />
      </Stack>
    )
  } catch (e) {
    return notFound()
  }
}
