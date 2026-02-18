'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { useEffect, useMemo } from 'react'

import { forceLogin, useLogOut } from '@dmr.is/auth/useLogOut'

import { useBreakpoint } from '@island.is/island-ui/core/hooks/useBreakpoint'

import { Box } from '../../island-is/lib/Box'
import type { DropdownMenuProps } from '../../island-is/lib/DropdownMenu'
import { DropdownMenu } from '../../island-is/lib/DropdownMenu'
import { GridColumn } from '../../island-is/lib/GridColumn'
import { GridContainer } from '../../island-is/lib/GridContainer'
import { GridRow } from '../../island-is/lib/GridRow'
import { Hidden } from '../../island-is/lib/Hidden'
import { Inline } from '../../island-is/lib/Inline'
import { Text } from '../../island-is/lib/Text'
import { ControlPanel, ControlPanelProps } from '../ControlPanel/ControlPanel'
import * as styles from './Header.css'
import { HeaderLogo } from './HeaderLogo'

type HeaderInfo = {
  title?: string
  description?: string
}

export type HeaderProps = {
  info?: HeaderInfo
  controlPanel?: ControlPanelProps
  settings?: React.ReactNode
  variant?: 'blue' | 'white'
}

export const Header = ({
  info = { title: 'Lögbirtingablað' },
  controlPanel,
  settings,
  variant = 'blue',
}: HeaderProps) => {
  const { data: session, status } = useSession()
  const logOut = useLogOut()
  const pathName = usePathname()
  const { md } = useBreakpoint()

  useEffect(() => {
    if (session?.invalid === true && status === 'authenticated') {
      // Make sure to log out if the session is invalid
      // This is just a front-end logout for the user's convenience
      // The session is invalidated on the server side
      forceLogin(pathName ?? '/innskraning')
    }
  }, [session?.invalid, status, pathName])

  const dropdownOptions = useMemo(() => {
    const options: DropdownMenuProps['items'] = [
      {
        title: 'Útskrá',
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          logOut()
        },
      },
    ]
    if (!md) {
      options.unshift({
        title: session?.user?.name ?? 'Notandi',
        icon: 'person',
        iconType: 'outline',
      })
    }

    return options
  }, [md])

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
                  space={[1, 2, 4]}
                >
                  <HeaderLogo />
                  {info && (
                    <Box
                      display="flex"
                      borderLeftWidth="standard"
                      borderStyle="solid"
                      borderColor="dark100"
                      alignItems="center"
                      height="full"
                      marginLeft={[1, 1, 0, 2]}
                      marginRight="auto"
                    >
                      <Box marginLeft={[2, 2, 3, 4]}>
                        {info.description ? (
                          <>
                            <Text variant="eyebrow">{info.title}</Text>
                            <p className={styles.infoDescription}>
                              {info.description}
                            </p>
                          </>
                        ) : (
                          <Text fontWeight="medium">{info.title}</Text>
                        )}
                      </Box>
                    </Box>
                  )}
                  {controlPanel && <ControlPanel {...controlPanel} />}
                </Inline>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="flexEnd"
                  width="full"
                >
                  {settings}
                  {session?.user ? (
                    <DropdownMenu
                      title={md ? (session.user.name ?? '') : ''}
                      icon={md ? 'chevronDown' : 'person'}
                      menuLabel={'Notandi'}
                      items={dropdownOptions}
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
