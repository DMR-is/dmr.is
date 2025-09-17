'use client'

import {
  Button,
  GridContainer,
  GridRow,
  Text,
} from '@dmr.is/ui/components/island-is'

import { GridColumn } from '@island.is/island-ui/core'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '10/12']}
          offset={['0', '1/12']}
          paddingBottom={3}
        >
          <Text variant="h2">Eitthvað fór úrskeiðis!</Text>
          <Button variant="utility" onClick={() => reset()}>
            Reyna aftur
          </Button>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
