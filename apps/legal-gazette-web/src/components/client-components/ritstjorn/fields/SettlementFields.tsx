'use client'

import {
  GridColumn,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'

export const SettlementFields = () => {
  const { advert } = useAdvertContext()

  if (!advert.settlement) {
    return null
  }

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Upplýsingar um búið</Text>
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
