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
      <ul>
        <li>Here should our adverts go when they have been created</li>
      </ul>
    </Stack>
  )
}
