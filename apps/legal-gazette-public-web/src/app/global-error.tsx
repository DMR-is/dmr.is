'use client'

import { useEffect } from 'react'

import {
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@dmr.is/ui/components/island-is'

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
            <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
              <Text variant="h2">Eitthvað fór úrskeiðis!</Text>
              <Button
                icon="reload"
                iconType="outline"
                variant="utility"
                onClick={() => reset()}
              >
                Reyna aftur
              </Button>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </body>
    </html>
  )
}
