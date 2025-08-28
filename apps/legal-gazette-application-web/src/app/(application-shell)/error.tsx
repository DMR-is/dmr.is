'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const message = error?.message ?? 'Villa kom upp'

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Box padding={[1, 2, 3, 4]} background="white">
            <Stack space={[1, 2]}>
              <Text variant="h2">{message}</Text>
              {error.message === 'Umsókn fannst ekki' && (
                <Text>Athugaðu hvort auðkenni slóðarinnar sé rétt.</Text>
              )}
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
