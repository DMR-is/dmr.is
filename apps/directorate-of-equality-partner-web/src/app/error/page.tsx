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
// instead (see innskraning/page.tsx for that list). In practice the code we
// expect to see here is `AccessDenied` - authOptions' `signIn` callback
// returns false when the id token has no company `nationalId`, i.e. an
// individual signed in without procuration for a company. Anything else
// reaching this page is a genuine provider/configuration failure.
function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)
  const isAccessDenied = error === 'AccessDenied'

  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '1/12']}
          span={['12/12', '10/12']}
        >
          <Stack space={2}>
            <Text variant="h2">
              {isAccessDenied
                ? 'Ekki hægt að skrá inn'
                : 'Innskráning mistókst'}
            </Text>
            <Text variant="intro">
              {isAccessDenied
                ? 'Innskráningin þín er ekki tengd fyrirtæki. Skráðu þig inn með kennitölu fyrirtækisins - til dæmis með umboði - til að fá aðgang að API-lyklum þess.'
                : 'Ekki tókst að staðfesta innskráningu hjá island.is. Reyndu aftur - ef villan er viðvarandi hafðu samband við þjónustuborð Jafnréttisstofu.'}
            </Text>
            {!isAccessDenied && error && (
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
