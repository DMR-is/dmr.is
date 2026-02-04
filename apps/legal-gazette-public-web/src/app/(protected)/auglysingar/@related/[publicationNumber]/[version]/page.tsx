import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { RelatedPublicationsContainer } from '../../../../../../containers/RelatedPublicationsContainer'
import { AdvertVersionEnum } from '../../../../../../gen/fetch'
import { trpc } from '../../../../../../lib/trpc/client/server'

export default async function RelatedPublications({
  params,
}: {
  params: { publicationNumber: string; version: AdvertVersionEnum }
}) {
  const { publications } = await fetchQueryWithHandler(
    trpc.getRelatedPublications.queryOptions({
      publicationNumber: params.publicationNumber,
      version: params.version,
    }),
  )

  return <RelatedPublicationsContainer publications={publications} />
}
