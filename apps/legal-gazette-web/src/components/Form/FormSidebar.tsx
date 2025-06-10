import dynamic from 'next/dynamic'

import { Stack } from '@island.is/island-ui/core'

import { AdvertDetailedDto } from '../../gen/fetch'
import { FormStatusButton } from './FormStatusButton'

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod.TextInput),
)

type Props = {
  advert: AdvertDetailedDto
}

export const AdvertSidebar = ({ advert }: Props) => {
  return (
    <Stack space={2}>
      <TextInput
        name="assigned-employee"
        defaultValue="Ármann Árni"
        label="Starfsmaður"
      />
      <TextInput
        name="advert-status"
        value={advert.status.title}
        label="Staða"
        disabled
      />

      <FormStatusButton advertId={advert.id} status={advert.status} />
    </Stack>
  )
}
