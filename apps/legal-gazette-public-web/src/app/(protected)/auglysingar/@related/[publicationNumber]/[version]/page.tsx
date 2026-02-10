import { ErrorBoundary } from 'react-error-boundary'

import {
  fetchQueryWithHandler,
  HydrateClient,
} from '@dmr.is/trpc/client/server'

import { RelatedPublicationsContainer } from '../../../../../../containers/RelatedPublicationsContainer'
import { trpc } from '../../../../../../lib/trpc/client/server'
import { handlePublicationRedirects } from '../../../../../../lib/utils/url-helpers'

export const dynamic = 'force-dynamic'

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

  await fetchQueryWithHandler(
    trpc.getRelatedPublications.queryOptions({
      publicationNumber,
      version,
    }),
  )

  return (
    <HydrateClient>
      <ErrorBoundary fallback={null}>
        <RelatedPublicationsContainer
          publicationNumber={publicationNumber}
          version={version}
        />
      </ErrorBoundary>
    </HydrateClient>
  )
}
