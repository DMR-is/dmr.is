'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const message = {
    title: 'Villa kom upp',
    message: 'Eitthvað fór úrskeiðis við að sækja gögnin.',
  }

  if (error.message === 'Auglýsing fannst ekki') {
    message.title = 'Auglýsing fannst ekki'
    message.message = 'Ekki náðist að sækja auglýsinguna.'
  }

  if (error.message === 'Failed to fetch') {
    message.title = 'Villa við tengingu'
    message.message = 'Ekki náðist að tengjast þjónustunni.'
  }

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Box padding={[1, 2, 3, 4]} background="white">
            <Stack space={[1, 2]}>
              <Text variant="h2">{message.title}</Text>
              <Text>{message.message}</Text>
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
