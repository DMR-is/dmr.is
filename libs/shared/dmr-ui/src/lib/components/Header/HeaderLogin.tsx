'use client'

import {
  Box,
  DropdownMenu,
  FocusableBox,
  GridColumn,
  GridContainer,
  GridRow,
  Hidden,
  Inline,
  useBreakpoint,
} from '@island.is/island-ui/core'

import skjaldarmerki from './images/skjaldarmerki.svg'
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
                <Inline
                  alignY="center"
                  justifyContent="flexStart"
                  space={[2, 2, 4]}
                >
                  <FocusableBox href={'/'} data-testid="link-back-home">
                    <img
                      src={skjaldarmerki}
                      alt="Skjaldarmerki"
                      width={lg ? 70 : 50}
                      height={lg ? 40 : 32}
                    />
                  </FocusableBox>
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
                        title: 'Stofna aðgang',
                      },
                    ]}
                    openOnHover
                    title="Innskráning"
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
