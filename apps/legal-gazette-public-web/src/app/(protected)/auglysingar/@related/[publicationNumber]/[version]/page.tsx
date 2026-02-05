import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { RelatedPublicationsContainer } from '../../../../../../containers/RelatedPublicationsContainer'
import { trpc } from '../../../../../../lib/trpc/client/server'
import { handlePublicationRedirects } from '../../../../../../lib/utils/url-helpers'

export default async function RelatedPublications({
  params,
}: {
  params: { publicationNumber: string; version: string }
}) {
  // Handle redirects for UUIDs and lowercase versions
  const { publicationNumber, version } = await handlePublicationRedirects(
    params.publicationNumber,
    params.version,
  )

  const { publications } = await fetchQueryWithHandler(
    trpc.getRelatedPublications.queryOptions({
      publicationNumber,
      version,
    }),
  )

  return <RelatedPublicationsContainer publications={publications} />
}
