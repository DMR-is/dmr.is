import {
  fetchQueryWithHandler,
  HydrateClient,
} from '@dmr.is/trpc/client/server'

import { AdvertContainer } from '../../../../containers/advert/AdvertContainer'
import { trpc } from '../../../../lib/trpc/client/server'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function AdvertDetails({ params }: Props) {
  const { id } = await params

  await fetchQueryWithHandler(trpc.getAdvert.queryOptions({ id }))

  return (
    <HydrateClient>
      <AdvertContainer advertId={id} />
    </HydrateClient>
  )
}
