import { notFound } from 'next/navigation'

import {
  fetchQueryWithHandler,
  HydrateClient,
} from '@dmr.is/trpc/client/server'

import { trpc } from '../../../../lib/trpc/client/server'
import { AdvertCorrectionPdfReplacementClient } from './_components/AdvertCorrectionPdfReplacementClient'

type Props = {
  params: Promise<{ uid: string[] }>
}

export default async function AdvertCorrectionPdfReplacementDetailPage({
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
      <AdvertCorrectionPdfReplacementClient advert={advertData.advert} />
    </HydrateClient>
  )
}
