'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

import { serverErrorText } from '../lib/text'

export default function RootError({
  error: _error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <GridContainer>
      <Box marginTop={10}>
        <ProblemTemplate
          variant="error"
          title={serverErrorText.title}
          message={serverErrorText.message}
          noBorder={false}
          imgSrc="/assets/tolfraedi-image.svg"
        />
        <Box display="flex" justifyContent="center" marginTop={4}>
          <Button variant="primary" onClick={() => reset()}>
            {serverErrorText.tryAgain}
          </Button>
        </Box>
      </Box>
    </GridContainer>
  )
}
