import { useRouter } from 'next/router'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Box } from '../../island-is/lib/Box'
import { Icon } from '../../island-is/lib/Icon'
import { Inline } from '../../island-is/lib/Inline'
import { LinkV2 } from '../../island-is/lib/LinkV2'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import * as styles from './ControlPanel.css'
import { findPath, flattenPaths } from './utils'

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
  const containerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!toggle) return

    const handleClickOutside = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setToggle(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setToggle(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [toggle])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        className={styles.controlPanel}
        onClick={() => setToggle((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={toggle}
        type="button"
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
      </button>
      {toggle && (
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
      )}
    </div>
  )
}
