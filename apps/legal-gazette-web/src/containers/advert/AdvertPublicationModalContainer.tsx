'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { AdvertPublicationModal } from '../../components/modals/AdvertPublicationModal'
import { AdvertPublicationDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

type Props = {
  advertId: string
}

const findOptimalPublicationId = (
  publications?: AdvertPublicationDto[],
): string => {
  if (!publications || publications.length === 0) return ''
  // search for next publication which is not published
  for (const pub of publications) {
    if (!pub.publishedAt) {
      return pub.id
    }
  }

  // all are published, return the last one
  return publications[publications.length - 1]?.id
}

export const AdvertPublicationModalContainer = ({ advertId }: Props) => {
  const trpc = useTRPC()
  const { data: advert } = useQuery(
    trpc.getAdvert.queryOptions({ id: advertId }),
  )
  const pubId = findOptimalPublicationId(advert?.publications)

  if (!pubId) return null
  return <AdvertPublicationModal pubId={pubId} />
}
