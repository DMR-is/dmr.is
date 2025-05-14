// import { usePathname } from 'next/navigation'

import { useSession } from 'next-auth/react'

import { useState } from 'react'
import { Popover, PopoverDisclosure, usePopoverState } from 'reakit'

import {
  Box,
  Icon,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { PagePaths } from '../../lib/constants'
import * as styles from './ControlPanel.css'
export const ControlPanel = () => {
  const { data } = useSession()
  const { formatMessage } = useFormatMessage()
  const [toggle, setToggle] = useState(false)
  const popover = usePopoverState({
    placement: 'bottom-start',
    visible: toggle,
    gutter: 0,
  })

  const isAdmin = data?.user.role.slug === 'ritstjori'

  const paths = isAdmin
    ? PagePaths.sort((a, b) => a.order - b.order).map((path) => {
        return {
          title: path.title,
          href: path.pathname,
        }
      })
    : []

  return (
    <>
      <PopoverDisclosure
        {...popover}
        className={styles.controlPanel}
        onClick={() => setToggle((prev) => !prev)}
      >
        <Box width="full">
          <Inline justifyContent="spaceBetween">
            <Stack space={0} align="left">
              <Text>Stjórnartíðindi</Text>
              <Text textAlign="left" variant="small" fontWeight="semiBold">
                Stjórnborð
              </Text>
            </Stack>
            {isAdmin && (
              <Box
                height="full"
                display="flex"
                flexDirection="column"
                justifyContent="center"
              >
                <Box
                  className={styles.controlPanelChevron({
                    color: 'white',
                  })}
                >
                  <Icon
                    size="small"
                    color="blue400"
                    type="outline"
                    icon={toggle ? 'chevronUp' : 'chevronDown'}
                  />
                </Box>
              </Box>
            )}
          </Inline>
        </Box>
      </PopoverDisclosure>
      <Popover {...popover}>
        <Box
          className={styles.dropdownMenu}
          background="white"
          borderColor="standard"
          borderLeftWidth="standard"
          borderRightWidth="standard"
        >
          <Stack space={0}>
            {paths.map((path, i) => (
              <LinkV2 href={path.href} key={path.href}>
                <Box
                  borderTopWidth={i === 0 ? 'standard' : undefined}
                  borderBottomWidth="standard"
                  borderColor="standard"
                  padding={2}
                  onClick={() => {
                    setToggle(false)
                    popover.hide()
                  }}
                >
                  <Inline justifyContent="spaceBetween">
                    <Text variant="small" fontWeight="semiBold">
                      {path.title}
                    </Text>
                    <Box
                      className={styles.controlPanelChevron({
                        color: 'blue',
                      })}
                    >
                      <Icon
                        color="blue400"
                        size="small"
                        type="outline"
                        icon="arrowForward"
                      />
                    </Box>
                  </Inline>
                </Box>
              </LinkV2>
            ))}
          </Stack>
        </Box>
      </Popover>
    </>
  )
}
