import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { NavigateBack } from '../../../../../../components/client-components/navigate-back/NavigateBack'
import { PublicationSidebarContainer } from '../../../../../../containers/PublicationSidebarContainer'
import { trpc } from '../../../../../../lib/trpc/client/server'
import { handlePublicationRedirects } from '../../../../../../lib/utils/url-helpers'

export default async function AdvertPageSidebar({
  params,
}: {
  params: Promise<{ publicationNumber: string; version: string }>
}) {
  // Handle redirects for UUIDs and lowercase versions
  const awaitedParams = await params
  const { publicationNumber, version } = await handlePublicationRedirects(
    awaitedParams.publicationNumber,
    awaitedParams.version,
  )

  const pub = await fetchQueryWithHandler(
    trpc.getPublicationByNumberAndVersion.queryOptions({
      publicationNumber,
      version,
    }),
  )

  return (
    <Stack space={[1, 2]}>
      <NavigateBack />
      <PublicationSidebarContainer publication={pub} />
    </Stack>
  )
}
