import cn from 'classnames'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

import {
  Box,
  DropdownMenu,
  FocusableBox,
  GridColumn,
  GridContainer,
  GridRow,
  Hidden,
  Inline,
  Logo,
} from '@island.is/island-ui/core'

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
  const { data: session } = useSession()
  const logOut = useLogOut()

  useEffect(() => {
    if (session?.invalid === true && session?.user) {
      // Make sure to log out if the session is invalid
      // This is just a front-end logout for the user's convenience
      // The session is invalidated on the server side
      forceLogin(pathName)
    }
  }, [session?.invalid, pathName])

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
