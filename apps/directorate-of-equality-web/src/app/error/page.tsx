'use client'
import { useSearchParams } from 'next/navigation'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export default function ErrorPage() {
  const params = useSearchParams()
  const error = params.get('error')

  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn paddingBottom={[2, 2, 3]} span={['12/12', '6/12']}>
          <Stack space={2}>
            <Text variant="h2">Villa við innskráningu</Text>
            <Text>
              {error === 'AccessDenied'
                ? 'Þú hefur ekki aðgang að þessu kerfi.'
                : 'Eitthvað fór úrskeiðis við innskráningu. Vinsamlegast reyndu aftur.'}
            </Text>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
