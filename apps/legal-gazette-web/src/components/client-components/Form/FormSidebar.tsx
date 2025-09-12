'use client'

import { Select } from '@dmr.is/ui/components/island-is'

import { Stack } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../hooks/useAdvertContext'
import { useClient } from '../../../hooks/useClient'

export const AdvertSidebar = () => {
  const { advert } = useAdvertContext()

  const userClient = useClient('UsersApi')

  return (
    <Stack space={2}>
      <Select label="Starfsmaður" options={[]} size="sm" />
    </Stack>
  )
}
