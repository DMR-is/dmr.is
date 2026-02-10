import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { Breadcrumbs, Stack } from '@dmr.is/ui/components/island-is'

import { trpc } from '../../../../../lib/trpc/client/server'
import { handlePublicationRedirects } from '../../../../../lib/utils/url-helpers'


export const dynamic = 'force-dynamic'

export default async function AdvertPage({
  params,
}: {
  params: { publicationNumber: string; version: string }
}) {
  // Handle redirects for UUIDs and lowercase versions
  const { publicationNumber, version } = await handlePublicationRedirects(
    params.publicationNumber,
    params.version,
  )

  // Fetch publication by publication number and version
  const pub = await fetchQueryWithHandler(
    trpc.getPublicationByNumberAndVersion.queryOptions({
      publicationNumber: publicationNumber,
      version: version,
    }),
  )

  const title = pub.publication.isLegacy
    ? `${pub.advert.type.title} - ${pub.advert.title}`
    : pub.advert.title

  const breadcrumbs = [
    {
      title: 'Lögbirtingarblað',
      href: '/',
    },
    {
      title: 'Auglýsingar',
      href: '/auglysingar',
    },
    {
      title: title,
    },
  ]

  return (
    <Stack space={[2]}>
      <Breadcrumbs items={breadcrumbs} />
      <AdvertDisplay html={pub.html} withStyles={!pub.publication.isLegacy} />
    </Stack>
  )
}
