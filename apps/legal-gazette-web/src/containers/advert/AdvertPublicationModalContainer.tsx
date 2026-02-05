'use client'

import { AdvertPublicationModal } from '../../components/modals/AdvertPublicationModal'

type Props = {
  pubId?: string | null
}

export const AdvertPublicationModalContainer = ({ pubId }: Props) => {
  if (!pubId) return null

  return <AdvertPublicationModal pubId={pubId} />
}
