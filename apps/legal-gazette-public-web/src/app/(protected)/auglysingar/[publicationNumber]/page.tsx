import { notFound, redirect } from 'next/navigation'

import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { trpc } from '../../../../lib/trpc/client/server'
import { isUUID } from '../../../../lib/utils/url-helpers'

export const dynamic = 'force-dynamic'

export default async function RedirectToFirstPublication({
  params,
}: {
  params: { publicationNumber: string }
}) {
  const { publicationNumber } = params

  // If it's a UUID, look up the publication and redirect to publication number URL
  if (isUUID(publicationNumber)) {
    let publication
    try {
      publication = await fetchQueryWithHandler(
        trpc.getPublicationById.queryOptions({
          publicationId: publicationNumber,
        }),
      )
    } catch (error) {
      // UUID format but publication not found
      return notFound()
    }

    // Redirect to the publication number URL (outside try-catch)
    redirect(
      `/auglysingar/${publication.advert.publicationNumber}/${publication.publication.version}`,
    )
  }

  // Normal flow: redirect to version A
  if (publicationNumber) {
    redirect(`/auglysingar/${publicationNumber}/A`)
  }

  return notFound()
}
