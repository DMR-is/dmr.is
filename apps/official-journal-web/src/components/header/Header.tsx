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

import * as styles from './Header.css'
import { useMockUser } from '../../hooks/useMockUser'
import { ControlPanel } from './ControlPanel'
import { messages } from '../../lib/messages'

export const Header = () => {
  const { mockUser } = useMockUser()

  return (
    <header className={styles.header}>
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
                    <DropdownMenu
                      title={mockUser.fullName}
                      items={[{ href: '#', title: messages.auth.logout }]}
                    />
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
