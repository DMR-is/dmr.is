'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { useEffect } from 'react'

import { forceLogin, useLogOut } from '@dmr.is/auth/useLogOut'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DropdownMenu } from '@dmr.is/ui/components/island-is/DropdownMenu'
import { FocusableBox } from '@dmr.is/ui/components/island-is/FocusableBox'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Hidden } from '@dmr.is/ui/components/island-is/Hidden'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'

import { ControlPanel } from './ControlPanel'
import * as styles from './Header.css'

export const Header = () => {
  const pathName = usePathname()
  const { data: session, status } = useSession()
  const logOut = useLogOut()

  useEffect(() => {
    if (session?.invalid === true && status === 'authenticated') {
      forceLogin(pathName ?? '/innskraning')
    }
  }, [session?.invalid, status, pathName])

  return (
    <Hidden print={true}>
      <header className={styles.header}>
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Inline alignY="center" justifyContent="spaceBetween">
                <Inline
                  space={[1, 1, 2, 3]}
                  justifyContent="flexStart"
                  alignY="center"
                >
                  <FocusableBox href="/" data-testid="link-back-home">
                    <Hidden above="md">
                      <img
                        src={'/assets/jafnrettisstofa-logo.svg'}
                        alt="Skjaldarmerki"
                        height={20}
                        style={{ maxHeight: '20px' }}
                      />
                    </Hidden>
                    <Hidden below="lg">
                      <img
                        src={'/assets/jafnrettisstofa-logo.svg'}
                        alt="Skjaldarmerki"
                        height={44}
                        style={{ maxHeight: '44px' }}
                      />
                    </Hidden>
                  </FocusableBox>
                  <ControlPanel />
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
                      menuLabel="Notandi"
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
