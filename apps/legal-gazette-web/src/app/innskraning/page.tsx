'use client'
import { signIn } from 'next-auth/react'

import { useEffect, useState } from 'react'

import { identityServerId } from '@dmr.is/auth/identityProvider'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { SIGNIN_ERROR_COOKIE } from '../../lib/auth/signinError'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    const fromCookie = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${SIGNIN_ERROR_COOKIE}=`))
    const fromUrl =
      new URLSearchParams(window.location.search).get('error') ===
      'AccessDenied'

    if (fromCookie) {
      document.cookie = `${SIGNIN_ERROR_COOKIE}=; Max-Age=0; Path=/`
    }
    // Only ever switch it on: dev strict mode runs this twice, and the cookie
    // is already gone the second time
    if (fromCookie || fromUrl) {
      setAccessDenied(true)
    }
  }, [])
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
                Skráðu þig inn í ritstjórn Lögbirtingablaðsins með rafrænum
                skilríkjum.
              </Text>
              {accessDenied && (
                <AlertMessage
                  type="error"
                  title="Innskráning mistókst"
                  message="Þú hefur ekki aðgang að þessu kerfi. Skráðu þig inn með öðrum aðgangi eða hafðu samband við umsjónaraðila."
                />
              )}
              <Box marginTop={[2, 2, 3]}>
                <Button
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      setLoading(true)
                      await signIn(identityServerId, { callbackUrl: '/' })
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
