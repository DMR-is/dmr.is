'use client'

import { Box } from '../../island-is/lib/Box'
import { GridColumn } from '../../island-is/lib/GridColumn'
import { GridContainer } from '../../island-is/lib/GridContainer'
import { GridRow } from '../../island-is/lib/GridRow'
import { Hidden } from '../../island-is/lib/Hidden'
import { Inline } from '../../island-is/lib/Inline'
import { Text } from '../../island-is/lib/Text'
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
