'use client'

import { useEffect } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(error)
  }, [error])

  return (
    <html>
      <body>
        <GridContainer>
          <GridRow>
            <GridColumn
              paddingBottom={5}
              paddingTop={5}
              span={['12/12', '10/12']}
              offset={['0', '1/12']}
            >
              <Stack space={3}>
                <Text variant="h2">Eitthvað fór úrskeiðis!</Text>
                <Button
                  icon="reload"
                  iconType="outline"
                  variant="utility"
                  onClick={() => reset()}
                >
                  Reyna aftur
                </Button>
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </body>
    </html>
  )
}
