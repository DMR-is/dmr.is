import { AdvertContainer } from '../../../../containers/advert/AdvertContainer'
import { getTrpcServer } from '../../../../lib/trpc/server/server'

type Props = {
  params: {
    id: string
  }
}

export default async function AdvertDetails({ params }: Props) {
  const { id } = params
  const { trpc, HydrateClient } = await getTrpcServer()

  void trpc.adverts.getAdvert.prefetch({ id: params.id })
  void trpc.baseEntity.getAllEntities.prefetch()

  return (
    <HydrateClient>
      <AdvertContainer id={id} />
    </HydrateClient>
  )
}
