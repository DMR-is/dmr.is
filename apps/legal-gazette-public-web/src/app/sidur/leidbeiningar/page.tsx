'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Link } from '@island.is/island-ui/core'

export default function Page() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '12/12', '8/12']}
          offset={['0', '0', '0', '1/12']}
        >
          <Stack space={3}>
            <Text variant="h2" as="h1">
              Leiðbeiningar
            </Text>
            <Stack space={0}>
              <Text>Hér eru leiðbeiningar varðandi Lögbirtingablaðið.</Text>
            </Stack>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
