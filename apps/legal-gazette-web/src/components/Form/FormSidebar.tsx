import dynamic from 'next/dynamic'

import { useMemo } from 'react'

import { Stack } from '@island.is/island-ui/core'

import { AdvertVersion, StatusIdEnum } from '../../gen/fetch'
import { useCaseContext } from '../../hooks/cases/useCase'
import { FormStatusButton } from './FormStatusButton'

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod.TextInput),
)

export const AdvertSidebar = () => {
  const { case: theCase, selectedAdvert, refetch } = useCaseContext()

  const isCasePublishable = useMemo(() => {
    if (
      selectedAdvert.status.id === StatusIdEnum.REJECTED ||
      selectedAdvert.status.id === StatusIdEnum.WITHDRAWN
    ) {
      return false
    }

    const statuses = [
      StatusIdEnum.PUBLISHED,
      StatusIdEnum.READY_FOR_PUBLICATION,
    ]
    switch (selectedAdvert.version) {
      case AdvertVersion.A: {
        return true
      }
      case AdvertVersion.B: {
        const versionA = theCase.adverts.find(
          (advert) => advert.version === AdvertVersion.A,
        )

        if (!versionA) return false

        return statuses.includes(versionA.status.id as StatusIdEnum)
      }
      case AdvertVersion.C: {
        const hasProcessedVersionB = theCase.adverts.find(
          (advert) => advert.version === AdvertVersion.B,
        )

        if (!hasProcessedVersionB) return false

        return statuses.includes(hasProcessedVersionB.status.id as StatusIdEnum)
      }
    }
  }, [selectedAdvert, theCase.adverts])

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
        publishable={isCasePublishable}
        onStatusChange={refetch}
      />
    </Stack>
  )
}
