import { useSession } from 'next-auth/react'

import { useEffect, useRef, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { PagePaths } from '../../lib/constants'
import * as styles from './ControlPanel.css'

export const ControlPanel = () => {
  const { data } = useSession()
  const { formatMessage } = useFormatMessage()
  const [toggle, setToggle] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isAdmin = data?.user.role.slug === 'ritstjori'

  const paths = isAdmin
    ? PagePaths.sort((a, b) => a.order - b.order).map((path) => {
        return {
          title: path.title,
          href: path.pathname,
        }
      })
    : []

  useEffect(() => {
    if (!toggle) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setToggle(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setToggle(false)
      }
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
        aria-expanded={toggle}
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
      </button>
      {toggle && (
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
      )}
    </div>
  )
}
