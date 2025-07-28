'use client'

import { Stack } from '@island.is/island-ui/core'

import { BankruptcyApplicationDto, CourtDistrictDto } from '../../../gen/fetch'
import { BankruptcyApplication } from './BankruptcyApplication'

type Props = {
  application: BankruptcyApplicationDto
  locations: CourtDistrictDto[]
}

export const BankruptcyApplicationScreen = ({
  application,
  locations,
}: Props) => {
  return (
    <Stack space={4}>
      <BankruptcyApplication locations={locations} initalState={application} />
    </Stack>
  )
}
