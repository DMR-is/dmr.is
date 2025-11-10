import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { PublicationSidebar } from '../../../../../../components/client-components/detailed-page/Sidebar/PublicationSidebar'
import { GetAdvertPublicationVersionEnum } from '../../../../../../gen/fetch'
import { trpc } from '../../../../../../lib/trpc/client/server'

export default async function AdvertPageSidebar({
  params,
}: {
  params: { id: string; version: string }
}) {
  const pub = await fetchQueryWithHandler(
    trpc.getPublication.queryOptions({
      advertId: params.id,
      version: params.version as GetAdvertPublicationVersionEnum,
    }),
  )

  return <PublicationSidebar publication={pub} />
}
