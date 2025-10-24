import { AdvertContainer } from '../../../../containers/advert/AdvertContainer'
import {
  fetchQueryWithHandler,
  HydrateClient,
  prefetch,
  trpc,
} from '../../../../lib/nTrpc/client/server'

type Props = {
  params: {
    id: string
  }
}

export default async function AdvertDetails({ params }: Props) {
  const { id } = params

  prefetch(trpc.getAllEntities.queryOptions())
  await fetchQueryWithHandler(trpc.getAdvert.queryOptions({ id }))

  return (
    <HydrateClient>
      <AdvertContainer id={id} />
    </HydrateClient>
  )
}
