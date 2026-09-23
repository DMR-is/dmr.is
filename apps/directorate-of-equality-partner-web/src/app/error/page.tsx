'use client'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { Suspense, useState } from 'react'

import { identityServerId } from '@dmr.is/auth/identityProvider'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

// authOptions sets `pages.error: '/error'`. NextAuth's core (core/index.js)
// only routes here for a code NOT among the ten it sends to the sign-in page
// instead (see innskraning/page.tsx for that list).
//
// Everything that reaches this page is a handshake or configuration failure:
// `AccessDenied` comes only from the two `return false` branches in `signIn`
// (no id_token, or a provider/access_token mismatch), and anything else is a
// provider error. The refusal for signing in without procuration does NOT
// arrive here - it returns a string so it can end the IDS session first, so
// no error code is attached, and it surfaces on /innskraning through the
// `doe-partner.signin_error` cookie. So there is deliberately no per-code
// branch here: one message for a failed handshake, with the code shown for
// support. An earlier version told a user with a broken handshake to retry
// with procuration, which sent them after the wrong problem.
function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)

  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '1/12']}
          span={['12/12', '10/12']}
        >
          <Stack space={2}>
            <Text variant="h2">Innskráning mistókst</Text>
            <Text variant="intro">
              Ekki tókst að staðfesta innskráningu hjá island.is. Reyndu aftur -
              ef villan er viðvarandi hafðu samband við þjónustuborð
              Jafnréttisstofu.
            </Text>
            {error && (
              <Text variant="small" color="dark400">
                Villukóði: {error}
              </Text>
            )}
            <Box marginTop={[2, 2, 3]}>
              <Button
                onClick={async (e) => {
                  e.preventDefault()
                  try {
                    setLoading(true)
                    await signIn(identityServerId, { callbackUrl: '/' })
                  } catch (e2) {
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
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}
