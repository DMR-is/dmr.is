'use client'
import { signIn } from 'next-auth/react'

import { useState } from 'react'

import { identityServerId } from '@dmr.is/auth/identityProvider'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  LinkV2,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

export default function Login() {
  const [loading, setLoading] = useState(false)
  return (
    <GridContainer>
      <GridRow marginTop={[2, 2, 3]}>
        <GridColumn
          paddingBottom={[2, 2, 3]}
          offset={['0', '1/12']}
          span={['12/12', '5/12']}
        >
          <Box component="img" src="/images/image-with-text-1.svg" />
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
                Skráðu þig inn á innri vef auglýsanda með rafrænum skilríkjum.
              </Text>

              <Box marginTop={[1, 2]}>
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
              <Box marginTop={[2, 4]}>
                <Text variant="intro" marginTop={2}>
                  Hér má sjá{' '}
                  <Text
                    color="blue400"
                    fontWeight="medium"
                    as="span"
                    variant="intro"
                  >
                    <LinkV2
                      href="https://logbirtingablad.is/sidur/leidbeiningar"
                      underlineVisibility="always"
                      underline="normal"
                      newTab
                    >
                      ítarlegri upplýsingar
                    </LinkV2>
                  </Text>{' '}
                  um innskráningu ásamt umboðsvirkni ef notandi/innsendandi vill
                  senda auglýsingu í nafni fyrirtækis.
                </Text>
              </Box>
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
