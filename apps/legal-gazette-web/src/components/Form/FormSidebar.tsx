import dynamic from 'next/dynamic'

import { AlertMessage, SkeletonLoader, Stack } from '@island.is/island-ui/core'

import { useAdvert } from '../../hooks/adverts/useAdvert'
import { FormStatusButton } from './FormStatusButton'

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod.TextInput),
)

type Props = {
  advertId: string
}

export const AdvertSidebar = ({ advertId }: Props) => {
  const {
    advert,
    isLoading,
    mutate: refetch,
  } = useAdvert({
    params: { id: advertId },
  })

  if (isLoading) {
    return (
      <SkeletonLoader space={2} height={64} repeat={3} borderRadius="large" />
    )
  }

  if (!advert) {
    return (
      <AlertMessage
        type="error"
        title="Villa kom upp"
        message="Ekki tóskt að sækja auglýsingu"
      />
    )
  }

  return (
    <Stack space={2}>
      <TextInput
        name="assigned-employee"
        defaultValue="Ármann Árni"
        label="Starfsmaður"
      />

      <FormStatusButton
        advertId={advert.id}
        caseId={advert.caseId}
        status={advert.status}
        onStatusChange={refetch}
      />
    </Stack>
  )
}
