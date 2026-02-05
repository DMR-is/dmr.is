import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { PublicationSidebarContainer } from '../../../../../../containers/PublicationSidebarContainer'
import { trpc } from '../../../../../../lib/trpc/client/server'
import { handlePublicationRedirects } from '../../../../../../lib/utils/url-helpers'

export default async function AdvertPageSidebar({
  params,
}: {
  params: { publicationNumber: string; version: string }
}) {
  // Handle redirects for UUIDs and lowercase versions
  const { publicationNumber, version } = await handlePublicationRedirects(
    params.publicationNumber,
    params.version,
  )

  const pub = await fetchQueryWithHandler(
    trpc.getPublicationByNumberAndVersion.queryOptions({
      publicationNumber,
      version,
    }),
  )

  return <PublicationSidebarContainer publication={pub} />
}
