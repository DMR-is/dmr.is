import { notFound } from 'next/navigation'

import { fetchQueryWithHandler, HydrateClient } from '@dmr.is/trpc/client/server'

import { trpc } from '../../../../lib/trpc/client/server'
import { AdvertPdfReplacementClient } from './_components/AdvertPdfReplacementClient'

type Props = {
  params: Promise<{ uid: string[] }>
}

export default async function AdvertPdfReplacementDetailPage({
  params,
}: Props) {
  const { uid } = await params
  const advertId = uid[0]

  if (!advertId) {
    notFound()
  }

  const advertData = await fetchQueryWithHandler(
    trpc.getAdvert.queryOptions({ id: advertId }),
  )

  if (!advertData?.advert) {
    notFound()
  }

  return (
    <HydrateClient>
      <AdvertPdfReplacementClient advert={advertData.advert} />
    </HydrateClient>
  )
}
