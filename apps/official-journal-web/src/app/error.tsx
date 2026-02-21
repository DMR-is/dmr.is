'use client'

import { Fragment, ReactNode } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

const nlToBr = (text: string): ReactNode =>
  text.split(/\r\n|\r|\n/g).map((s, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {s}
    </Fragment>
  ))

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={'12/12'} paddingBottom={10} paddingTop={8}>
          <Box
            display="flex"
            flexDirection="column"
            width="full"
            alignItems="center"
          >
            <Text
              variant="eyebrow"
              as="div"
              paddingBottom={2}
              color="purple400"
            >
              500
            </Text>
            <Text variant="h1" as="h1" paddingBottom={3}>
              Afsakið hlé.
            </Text>
            <Text variant="intro" as="div" paddingBottom={4}>
              {nlToBr(
                'Eitthvað fór úrskeiðis.\nVillan hefur verið skráð og unnið verður að viðgerð eins fljótt og auðið er.',
              )}
            </Text>
            <Button variant="ghost" onClick={reset}>
              Reyna aftur
            </Button>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
