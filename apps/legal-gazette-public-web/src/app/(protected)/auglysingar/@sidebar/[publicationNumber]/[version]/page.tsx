import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { PublicationSidebarContainer } from '../../../../../../containers/PublicationSidebarContainer'
import { AdvertVersionEnum } from '../../../../../../gen/fetch'
import { trpc } from '../../../../../../lib/trpc/client/server'

export default async function AdvertPageSidebar({
  params,
}: {
  params: { publicationNumber: string; version: AdvertVersionEnum }
}) {
  const pub = await fetchQueryWithHandler(
    trpc.getPublicationByNumberAndVersion.queryOptions({
      publicationNumber: params.publicationNumber,
      version: params.version,
    }),
  )

  return <PublicationSidebarContainer publication={pub} />
}
