import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import cn from 'classnames'
import { useEffect } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DropdownMenu } from '@dmr.is/ui/components/island-is/DropdownMenu'
import { FocusableBox } from '@dmr.is/ui/components/island-is/FocusableBox'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
// TODO: Change import
import { Hidden, Logo } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { forceLogin, useLogOut } from '../../hooks/useLogOut'
import { ControlPanel } from './ControlPanel'
import * as styles from './Header.css'
import { messages } from './messages'

type HeaderType = {
  headerWhite?: boolean
}

export const Header = ({ headerWhite }: HeaderType) => {
  const { formatMessage } = useFormatMessage()
  const pathName = usePathname()
  const { data: session, status } = useSession()
  const logOut = useLogOut()

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
      <header className={cn(styles.header, { white: headerWhite })}>
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Inline alignY="center" justifyContent="spaceBetween">
                <Inline
                  space={[1, 1, 2, 3]}
                  justifyContent="flexStart"
                  alignY="center"
                >
                  <FocusableBox href={'/'} data-testid="link-back-home">
                    <Hidden above="md">
                      <Logo id="header-logo-icon" width={40} iconOnly />
                    </Hidden>
                    <Hidden below="lg">
                      <Logo id="header-logo" width={160} />
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
                      title={session.user.displayName}
                      icon="chevronDown"
                      menuLabel={formatMessage(messages.auth.user)}
                      items={[
                        {
                          title: formatMessage(messages.auth.logout),
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
