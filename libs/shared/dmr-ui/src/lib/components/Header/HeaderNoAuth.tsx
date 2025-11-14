'use client'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Hidden,
  Inline,
  Logo,
  useBreakpoint,
} from '@island.is/island-ui/core'

import * as styles from './Header.css'

export type HeaderProps = {
  variant?: 'blue' | 'white'
}

export const HeaderNoAuth = ({ variant = 'blue' }: HeaderProps) => {
  const { lg } = useBreakpoint()

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
                  <Logo
                    id="header-logo"
                    width={lg ? 160 : 30}
                    iconOnly={lg ? false : true}
                  />
                </Inline>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </header>
    </Hidden>
  )
}
