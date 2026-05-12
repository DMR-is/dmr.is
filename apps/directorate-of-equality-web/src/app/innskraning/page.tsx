'use client'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { Suspense, useEffect, useState } from 'react'

import { identityServerId } from '@dmr.is/auth/identityProvider'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

const SIGNIN_ERROR_COOKIE = 'doe.signin_error'
const SIGNIN_ERROR_MESSAGE = 'Ekki tókst að skrá þig inn. Reyndu aftur síðar.'

function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const hasUrlError = searchParams.get('error') !== null
  const [hasCookieError, setHasCookieError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const present = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${SIGNIN_ERROR_COOKIE}=`))
    if (present) {
      setHasCookieError(true)
      document.cookie = `${SIGNIN_ERROR_COOKIE}=; Max-Age=0; Path=/`
    }
  }, [])

  const showError = hasUrlError || hasCookieError

  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '1/12']}
          span={['12/12', '5/12']}
        >
          <Box component="img" src="/assets/image-with-text-1.svg" />
        </GridColumn>
        <GridColumn paddingBottom={[2, 2, 3]} span={['12/12', '5/12']}>
          <Box
            display="flex"
            flexDirection="column"
            height="full"
            justifyContent="center"
          >
            <Stack space={2}>
              <Text variant="h2">Innskráning</Text>
              <Text variant="intro">
                Skráðu þig inn í kerfi Jafnréttisstofu með rafrænum skilríkjum.
              </Text>
              {showError && (
                <AlertMessage
                  type="error"
                  title="Innskráning mistókst"
                  message={SIGNIN_ERROR_MESSAGE}
                />
              )}
              <Box marginTop={[2, 2, 3]}>
                <Button
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      setLoading(true)
                      await signIn(identityServerId, { callbackUrl })
                    } catch (error) {
                      setLoading(false)
                    }
                  }}
                  icon="person"
                  iconType="outline"
                  loading={loading}
                >
                  Skrá inn með rafrænum skilríkjum
                </Button>
              </Box>
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

export default function Login() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
