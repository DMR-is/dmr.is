'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Hidden,
  Inline,
  Text,
} from '@island.is/island-ui/core'

import * as styles from './Header.css'
import { HeaderLogo } from './HeaderLogo'

export type HeaderProps = {
  variant?: 'blue' | 'white'
}

export const HeaderNoAuth = ({ variant = 'blue' }: HeaderProps) => {
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
                  space={[1, 1, 4]}
                >
                  <HeaderLogo />
                  <Box
                    display="flex"
                    borderLeftWidth="standard"
                    borderStyle="solid"
                    borderColor="dark100"
                    alignItems="center"
                    height="full"
                    marginLeft={[1, 1, 0, 2]}
                    marginRight="auto"
                  >
                    <Box marginLeft={[2, 2, 3, 4]}>
                      <Text fontWeight="medium">Lögbirtingablað</Text>
                    </Box>
                  </Box>
                </Inline>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </header>
    </Hidden>
  )
}
