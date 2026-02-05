import { notFound, redirect } from 'next/navigation'

import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'

import { trpc } from '../../../../lib/trpc/client/server'
import { isUUID } from '../../../../lib/utils/url-helpers'

export default async function RedirectToFirstPublication({
  params,
}: {
  params: { publicationNumber: string }
}) {
  const { publicationNumber } = params

  // If it's a UUID, look up the publication and redirect to publication number URL
  if (isUUID(publicationNumber)) {
    try {
      const publication = await fetchQueryWithHandler(
        trpc.getPublicationById.queryOptions({
          publicationId: publicationNumber,
        }),
      )

      // Redirect to the publication number URL
      redirect(
        `/auglysingar/${publication.advert.publicationNumber}/${publication.publication.version}`,
      )
    } catch (error) {
      // UUID format but publication not found
      return notFound()
    }
  }

  // Normal flow: redirect to version A
  if (publicationNumber) {
    redirect(`/auglysingar/${publicationNumber}/A`)
  }

  return notFound()
}
