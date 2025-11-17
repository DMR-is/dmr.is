import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { PublicationSidebar } from '../../../../../../components/client-components/detailed-page/Sidebar/PublicationSidebar'
import { AdvertVersionEnum } from '../../../../../../gen/fetch'
import { trpc } from '../../../../../../lib/trpc/client/server'

export default async function AdvertPageSidebar({
  params,
}: {
  params: { id: string; version: string }
}) {
  const pub = await fetchQueryWithHandler(
    trpc.getPublication.queryOptions({
      advertId: params.id,
      version: params.version as AdvertVersionEnum,
    }),
  )

  return <PublicationSidebar publication={pub} />
}
