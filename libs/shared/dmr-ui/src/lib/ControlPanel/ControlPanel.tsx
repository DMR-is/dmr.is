import {
  Box,
  Icon,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@island.is/island-ui/core'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { Popover, PopoverDisclosure, usePopoverState } from 'reakit'
import * as styles from './ControlPanel.css'
import { findPath, flattenPaths } from '../../utils'
export type ControlPanelRoute = {
  path: string
  pathName: string
  pattern?: string
  children?: ControlPanelRoute[]
  showInNavigation?: boolean
}

export type ControlPanelProps = {
  title: string
  paths: ControlPanelRoute[]
}

export const ControlPanel = ({ paths, title }: ControlPanelProps) => {
  const router = useRouter()
  const [toggle, setToggle] = useState(false)

  const popover = usePopoverState({
    placement: 'bottom-start',
    visible: toggle,
    gutter: 0,
  })

  const flattenedPaths = useMemo(() => {
    return flattenPaths(paths)
  }, [paths])

  const activePath = useMemo(() => {
    return findPath(paths, router.pathname)
  }, [router.pathname, paths])

  useEffect(() => {
    router.events.on('routeChangeStart', () => {
      setToggle(false)
    })

    return () => {
      router.events.off('routeChangeStart', () => {
        setToggle(false)
      })
    }
  }, [router.events])

  return (
    <>
      <PopoverDisclosure
        {...popover}
        className={styles.controlPanel}
        onClick={() => setToggle((prev) => !prev)}
      >
        <Box width="full">
          <Inline alignY="center" justifyContent="spaceBetween">
            <Stack space={0}>
              <Text>{title}</Text>
              {activePath !== null && (
                <Text textAlign="left" variant="small" fontWeight="semiBold">
                  {activePath}
                </Text>
              )}
            </Stack>
            <Icon
              size="small"
              color="blue400"
              type="outline"
              icon={toggle ? 'chevronUp' : 'chevronDown'}
            />
          </Inline>
        </Box>
      </PopoverDisclosure>
      <Popover {...popover}>
        <Box
          background="white"
          borderColor="standard"
          borderLeftWidth="standard"
          borderRightWidth="standard"
          className={styles.dropdownMenu}
        >
          <Stack space={0}>
            {flattenedPaths.map((path, i) => (
              <LinkV2 href={path.path} key={path.path}>
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
                      {path.pathName}
                    </Text>
                    <Box>
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
