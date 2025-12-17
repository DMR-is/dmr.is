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
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import * as styles from '../skraning.css'

export default function Signup() {
  const [loading, setLoading] = useState(false)
  return (
    <GridContainer className={styles.contentContainer}>
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
              <Text variant="h2">Gerast áskrifandi</Text>
              <Text variant="intro">
                Velkomin á skráningarvef fyrir rafræna áskrift Lögbirtingablaðs
              </Text>
              <Text>
                Við skráninguna verður til greiðsluseðill að fjárhæð 4.500 kr.
                sem er ársáskriftargjald sem greitt er fyrirfram. Það opnast
                fyrir aðgang að kerfinu í eitt ár daginn eftir að sú upphæð
                hefur verið greidd. Hefjið skráningarferlið með því að skrá inn
                með rafrænum skilríkjum.
              </Text>
              <Box marginTop={[2, 2, 3]}>
                <Button
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      setLoading(true)
                      await signIn(identityServerId, {
                        callbackUrl: '/skraning',
                      })
                    } catch (error) {
                      setLoading(false)
                    }
                  }}
                  icon="person"
                  iconType="outline"
                  loading={loading}
                >
                  Hefja skráningu með rafrænum skilríkjum
                </Button>
              </Box>
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
