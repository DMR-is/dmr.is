'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { useEffect } from 'react'

import { forceLogin } from '@dmr.is/auth/useLogOut'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { ProblemTemplate } from '@dmr.is/ui/components/island-is/ProblemTemplate'

import { serverErrorText } from '../../lib/text'

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
          title={serverErrorText.title}
          message={serverErrorText.message}
          noBorder={false}
          imgSrc="/assets/tolfraedi-image.svg"
        />
        <Box
          display="flex"
          justifyContent="center"
          columnGap={2}
          marginTop={4}
        >
          <Button variant="primary" onClick={() => reset()}>
            {serverErrorText.tryAgain}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/yfirlit')}>
            {serverErrorText.backToOverview}
          </Button>
        </Box>
      </Box>
    </GridContainer>
  )
}
