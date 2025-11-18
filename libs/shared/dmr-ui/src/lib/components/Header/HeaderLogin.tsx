'use client'

import {
  Box,
  DropdownMenu,
  GridColumn,
  GridContainer,
  GridRow,
  Hidden,
  Inline,
} from '@island.is/island-ui/core'

import * as styles from './Header.css'
import { HeaderLogo } from './HeaderLogo'

export type HeaderProps = {
  variant?: 'blue' | 'white'
}

export const HeaderLogin = ({ variant = 'blue' }: HeaderProps) => {
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
                  space={[2, 2, 4]}
                >
                  <HeaderLogo />
                </Inline>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="flexEnd"
                  width="full"
                >
                  <DropdownMenu
                    icon="person"
                    items={[
                      {
                        href: '/innskraning',
                        title: 'Skrá inn',
                      },
                      {
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        onClick: () => {},
                        title: 'Gerast áskrifandi',
                      },
                    ]}
                    openOnHover
                    title="Áskrift innskráning"
                  />
                </Box>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </header>
    </Hidden>
  )
}
