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
  Hidden,
  Inline,
  Text,
  useBreakpoint,
} from '@island.is/island-ui/core'

import * as styles from './Header.css'
import { HeaderLogo } from './HeaderLogo'

export type HeaderProps = {
  variant?: 'blue' | 'white'
  redirectTo?: string
}

export const HeaderLogin = ({
  variant = 'blue',
  redirectTo = '/',
}: HeaderProps) => {
  const { md } = useBreakpoint()
  const [loading, setLoading] = useState(false)
  return (
    <Hidden print={true}>
      <header className={styles.header({ variant })}>
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Inline alignY="center" justifyContent="spaceBetween">
                <Inline
                  alignY="center"
                  justifyContent="flexStart"
                  space={[1, 2, 4]}
                >
                  <HeaderLogo />
                  <Text variant="h4" fontWeight="regular">
                    Lögbirtingablað
                  </Text>
                </Inline>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="flexEnd"
                  width="full"
                >
                  <Button
                    variant="utility"
                    size="small"
                    icon={md ? 'person' : undefined}
                    iconType="outline"
                    // loading={loading}
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        setLoading(true)
                        await signIn(identityServerId, {
                          callbackUrl: redirectTo,
                        })
                      } catch (error) {
                        setLoading(false)
                      }
                    }}
                  >
                    Innskráning
                  </Button>
                </Box>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </header>
    </Hidden>
  )
}
