'use client'

import {
  DropdownMenu,
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

export const HeaderLogin = ({ variant = 'blue' }: HeaderProps) => {
  const { lg } = useBreakpoint()

  return (
    <Hidden print={true}>
      <header className={styles.header({ variant })}>
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Inline alignY="center" justifyContent="spaceBetween">
                <Logo
                  id="header-logo"
                  width={lg ? 160 : 30}
                  iconOnly={lg ? false : true}
                />
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
                      title: 'Stofna aðgang',
                    },
                  ]}
                  openOnHover
                  title="Innskráning"
                />
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </header>
    </Hidden>
  )
}
