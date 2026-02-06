'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { AdvertPublicationModal } from '../../components/modals/AdvertPublicationModal'
import { useTRPC } from '../../lib/trpc/client/trpc'

type Props = {
  advertId: string
}

export const AdvertPublicationModalContainer = ({ advertId }: Props) => {
  const trpc = useTRPC()
  const { data: advert } = useQuery(
    trpc.getAdvert.queryOptions({ id: advertId }),
  )

  const publications = advert?.publications
  if (!publications || publications.length === 0) return null

  return (
    <AdvertPublicationModal
      advertId={advertId}
      publications={publications}
    />
  )
}
