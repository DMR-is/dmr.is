import { AdvertContainer } from '../../../../containers/advert/AdvertContainer'
import { getTrpcServer } from '../../../../lib/trpc/server/server'

type Props = {
  params: {
    id: string
  }
}

export default async function AdvertDetails({ params }: Props) {
  const { trpc } = await getTrpcServer()

  const advert = await trpc.adverts.getAdvert({ id: params.id })
  void trpc.baseEntity.getAllEntities()

  return <AdvertContainer advert={advert} />
}
