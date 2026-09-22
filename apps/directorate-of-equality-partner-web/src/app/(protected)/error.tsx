'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { useEffect } from 'react'

import { forceLogin } from '@dmr.is/auth/useLogOut'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

// The tRPC context (src/lib/trpc/server/trpc.ts) throws UNAUTHORIZED when
// `session.invalid` is set, which is exactly the case this boundary exists
// to route out of: a session the middleware let through a moment ago but
// that failed its refresh since. Force a real re-login rather than letting
// the user retry into the same error.
export default function ProtectedError({
  error: _error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const pathName = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (session?.invalid === true && status === 'authenticated') {
      forceLogin(pathName ?? '/innskraning')
    }
  }, [session?.invalid, status, pathName])

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
