import { PublicationSidebar } from '../../../../../../components/client-components/detailed-page/Sidebar/PublicationSidebar'
import { GetAdvertPublicationVersionEnum } from '../../../../../../gen/fetch'
import { getTrpcServer } from '../../../../../../lib/trpc/server/server'

export default async function AdvertPageSidebar({
  params,
}: {
  params: { id: string; version: string }
}) {
  const { trpc } = await getTrpcServer()

  const pub = await trpc.publicationApi.getPublication({
    advertId: params.id,
    version: params.version as GetAdvertPublicationVersionEnum,
  })

  return <PublicationSidebar publication={pub} />
}
