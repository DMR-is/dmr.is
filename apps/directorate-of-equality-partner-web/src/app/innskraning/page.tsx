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

// NextAuth's core (core/index.js) sends exactly ten error codes to the
// sign-in page instead of `pages.error`: Signin, OAuthSignin, OAuthCallback,
// OAuthCreateAccount, EmailCreateAccount, Callback, OAuthAccountNotLinked,
// EmailSignin, CredentialsSignin and SessionRequired. `AccessDenied` - the
// code authOptions' `signIn` callback produces for a caller with no company
// `nationalId` on the token - is NOT in that list, so it never lands here;
// it goes to /error instead. `SessionRequired` is the one code in this list
// that is ordinary navigation (an unauthenticated visit to a protected
// route), not a failure, so it gets no alert. Everything else in the list is
// a genuine sign-in/OAuth failure and gets a generic retry message.
//
// A refused sign-in (no company nationalId on the id token) is a separate,
// higher-priority signal: `signIn` returns a string (not `false`) so it can
// end the IDS session first, which means NextAuth attaches no `?error=` and
// the round trip through IDS does not preserve query params either. The
// redirect route sets a same-origin, JS-readable `doe-partner.signin_error`
// cookie instead - see src/app/api/auth/access-denied/route.ts. Read it once
// and clear it so the message shows exactly once, and let it take priority
// over the generic query-param message if both were somehow present, since
// it names the actual cause rather than a generic retry prompt.
const SIGNIN_ERROR_COOKIE = 'doe-partner.signin_error'

function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const error = searchParams.get('error')
  const hasSignInFailure = !!error && error !== 'SessionRequired'
  const [hasProcurationError, setHasProcurationError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const present = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${SIGNIN_ERROR_COOKIE}=`))
    if (present) {
      setHasProcurationError(true)
      document.cookie = `${SIGNIN_ERROR_COOKIE}=; Max-Age=0; Path=/`
    }
  }, [])

  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '1/12']}
          span={['12/12', '10/12']}
        >
          <Box
            display="flex"
            flexDirection="column"
            height="full"
            justifyContent="center"
          >
            <Stack space={2}>
              <Text variant="h2">Innskráning</Text>
              <Text variant="intro">
                Skráðu þig inn með rafrænum skilríkjum fyrirtækisins til að
                sækja um eða endurnýja API-lykil fyrir Jafnréttisstofu.
              </Text>
              {hasProcurationError ? (
                <AlertMessage
                  type="error"
                  title="Ekki tókst að skrá inn"
                  message="Innskráningin þín er ekki tengd fyrirtæki. Skráðu þig inn með kennitölu fyrirtækisins - til dæmis með umboði (prókúru) - til að fá aðgang að API-lyklum þess."
                />
              ) : (
                hasSignInFailure && (
                  <AlertMessage
                    type="error"
                    title="Ekki tókst að skrá inn"
                    message="Innskráning mistókst. Reyndu aftur eða hafðu samband við þjónustuborð Jafnréttisstofu ef villan er viðvarandi."
                  />
                )
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
