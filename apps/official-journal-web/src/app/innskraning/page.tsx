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

function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const [loading, setLoading] = useState(false)

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
                Skráðu þig inn hér með rafrænum skilríkjum.
              </Text>
              <Box marginTop={[2, 2, 3]}>
                <Button
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      setLoading(true)
                      await signIn(identityServerId, {
                        callbackUrl,
                      })
                    } catch {
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
