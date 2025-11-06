'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

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

  if (error.message === 'Umsókn fannst ekki') {
    message.title = 'Umsókn fannst ekki'
    message.message = 'Ekki náðist að sækja umsóknina.'
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
