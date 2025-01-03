import cn from 'classnames'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

import {
  Box,
  Column,
  Columns,
  DropdownMenu,
  FocusableBox,
  GridColumn,
  GridContainer,
  GridRow,
  Hidden,
  Logo,
} from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useLogOut } from '../../hooks/useLogOut'
import { ControlPanel } from './ControlPanel'
import * as styles from './Header.css'
import { messages } from './messages'

type HeaderType = {
  headerWhite?: boolean
}

export const Header = ({ headerWhite }: HeaderType) => {
  const { formatMessage } = useFormatMessage()
  const { data: session } = useSession()
  const logOut = useLogOut()

  useEffect(() => {
    if (session?.invalid === true) {
      // Make sure to log out if the session is invalid
      // This is just a front-end logout for the user's convenience
      // The session is invalidated on the server side
      logOut()
    }
  }, [session?.invalid])

  return (
    <header className={cn(styles.header, { white: headerWhite })}>
      <Hidden print={true}>
        <GridContainer>
          <GridRow>
            <GridColumn span="12/12">
              <Columns alignY="center">
                <Column width="content">
                  <FocusableBox href={'/'} data-testid="link-back-home">
                    <Hidden above="md">
                      <Logo id="header-logo-icon" width={40} iconOnly />
                    </Hidden>
                    <Hidden below="lg">
                      <Logo id="header-logo" width={160} />
                    </Hidden>
                  </FocusableBox>
                </Column>
                <Hidden below="lg">
                  <Column>
                    <Box paddingX={3}>
                      <ControlPanel />
                    </Box>
                  </Column>
                </Hidden>
                <Column>
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
                </Column>
              </Columns>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Hidden>
    </header>
  )
}
