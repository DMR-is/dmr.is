import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { Stack, Text } from '@dmr.is/ui/components/island-is'

import { AdvertVersionEnum } from '../../../../../gen/fetch'
import { trpc } from '../../../../../lib/trpc/client/server'

export default async function AdvertPage({
  params,
}: {
  params: { id: string; version: AdvertVersionEnum }
}) {
  const pub = await fetchQueryWithHandler(
    trpc.getPublication.queryOptions({
      advertId: params.id,
      version: params.version as AdvertVersionEnum,
    }),
  )

  const title = pub.publication.isLegacy
    ? `${pub.advert.type.title} - ${pub.advert.title}`
    : pub.advert.title

  return (
    <Stack space={[2, 3]}>
      <Text variant="h3">{title}</Text>
      <AdvertDisplay html={pub.html} withStyles={!pub.publication.isLegacy} />
    </Stack>
  )
}
