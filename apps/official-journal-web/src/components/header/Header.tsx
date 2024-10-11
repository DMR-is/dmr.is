import cn from 'classnames'
import { signOut, useSession } from 'next-auth/react'

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
import { Routes } from '../../lib/constants'
import { ControlPanel } from './ControlPanel'
import * as styles from './Header.css'
import { messages } from './messages'

type HeaderType = {
  headerWhite?: boolean
}

export const Header = ({ headerWhite }: HeaderType) => {
  const { formatMessage } = useFormatMessage()
  const { data: session } = useSession()

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
                              signOut({
                                callbackUrl: Routes.Login,
                                redirect: true,
                              })
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
