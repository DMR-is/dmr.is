'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { useEffect } from 'react'

import { forceLogin, useLogOut } from '@dmr.is/auth/useLogOut'

import {
  Box,
  DropdownMenu,
  GridColumn,
  GridContainer,
  GridRow,
  Hidden,
  Inline,
  Logo,
  useBreakpoint,
} from '@island.is/island-ui/core'

import { ControlPanel, ControlPanelProps } from '../ControlPanel/ControlPanel'
import * as styles from './Header.css'

export type HeaderProps = {
  controlPanel?: ControlPanelProps
  variant?: 'blue' | 'white'
}

export const Header = ({ controlPanel, variant = 'blue' }: HeaderProps) => {
  const { lg } = useBreakpoint()
  const { data: session, status } = useSession()
  const logOut = useLogOut()
  const pathName = usePathname()

  useEffect(() => {
    if (session?.invalid === true && status === 'authenticated') {
      // Make sure to log out if the session is invalid
      // This is just a front-end logout for the user's convenience
      // The session is invalidated on the server side
      forceLogin(pathName ?? '/innskraning')
    }
  }, [session?.invalid, status, pathName])
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

                  {controlPanel && <ControlPanel {...controlPanel} />}
                </Inline>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="flexEnd"
                  width="full"
                >
                  {session?.user ? (
                    <DropdownMenu
                      title={session.user.name ?? ''}
                      icon="chevronDown"
                      menuLabel={'Notandi'}
                      items={[
                        {
                          title: 'Útskrá',
                          onClick: (e) => {
                            e.preventDefault()
                            logOut()
                          },
                        },
                      ]}
                    />
                  ) : null}
                </Box>
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </header>
    </Hidden>
  )
}
