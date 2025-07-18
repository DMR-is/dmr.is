'use client'

import { Stack } from '@island.is/island-ui/core'

import { BankruptcyApplicationDto } from '../../../gen/fetch'
import { BankruptcyApplication } from './BankruptcyApplication'

type Props = {
  application: BankruptcyApplicationDto
}

export const BankruptcyApplicationScreen = ({ application }: Props) => {
  return (
    <Stack space={4}>
      <BankruptcyApplication initalState={application} />
      <ul>
        <li>Here should our adverts go when they have been created</li>
      </ul>
    </Stack>
  )
}
