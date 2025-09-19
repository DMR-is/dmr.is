import { PublicationSidebar } from '../../../../../../components/client-components/detailed-page/Sidebar/PublicationSidebar'
import { GetAdvertPublicationVersionEnum } from '../../../../../../gen/fetch'
import { getPublication } from '../../../../../../lib/cache/publication'

export default async function AdvertPageSidebar({
  params,
}: {
  params: { id: string; version: string }
}) {
  const pub = await getPublication(
    params.id,
    params.version as GetAdvertPublicationVersionEnum,
  )

  return <PublicationSidebar publication={pub} />
}
