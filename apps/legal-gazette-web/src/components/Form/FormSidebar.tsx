import dynamic from 'next/dynamic'

import { Stack } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/cases/useCase'
import { FormStatusButton } from './FormStatusButton'

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod.TextInput),
)

export const AdvertSidebar = () => {
  const { case: theCase, selectedAdvert, refetch } = useCaseContext()

  return (
    <Stack space={2}>
      <TextInput
        name="assigned-employee"
        defaultValue="Ármann Árni"
        label="Starfsmaður"
      />

      <FormStatusButton
        advertId={selectedAdvert.id}
        caseId={theCase.id}
        status={selectedAdvert.status}
        onStatusChange={refetch}
      />
    </Stack>
  )
}
