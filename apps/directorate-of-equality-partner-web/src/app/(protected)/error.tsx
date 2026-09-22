'use client'

import { useRouter } from 'next/navigation'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

export default function ProtectedError({
  error: _error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const router = useRouter()

  return (
    <GridContainer>
      <Box marginTop={10}>
        <ProblemTemplate
          variant="error"
          title="Villa kom upp"
          message="Ekki tókst að sækja gögnin þín. Reyndu aftur eða farðu til baka á forsíðu."
          noBorder={false}
        />
        <Box display="flex" justifyContent="center" columnGap={2} marginTop={4}>
          <Button variant="primary" onClick={() => reset()}>
            Reyna aftur
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Til baka á forsíðu
          </Button>
        </Box>
      </Box>
    </GridContainer>
  )
}
