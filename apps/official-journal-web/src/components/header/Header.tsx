import cn from 'classnames'

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
import { ControlPanel } from './ControlPanel'
import * as styles from './Header.css'
import { messages } from './messages'
type HeaderType = {
  headerWhite?: boolean
}

export const Header = ({ headerWhite }: HeaderType) => {
  const { formatMessage } = useFormatMessage()

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
                    <DropdownMenu
                      title={'Ármann Árni'}
                      icon="chevronDown"
                      items={[
                        {
                          // href: '#',
                          title: formatMessage(messages.auth.logout),
                          onClick: (e) => {
                            e.preventDefault()
                            // TODO: implement logout
                            console.log('not implemented!')
                          },
                        },
                      ]}
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
