'use client'

import cn from 'classnames'
import React, { PropsWithChildren } from 'react'

import { Box } from '@island.is/island-ui/core/Box/Box'
import { Button } from '@island.is/island-ui/core/Button/Button'
// Must load after ModalBase: its unconditional `.modal { width: 100% }`
// would otherwise be emitted after (and override) this file's media-query
// width overrides, since CSS module evaluation order follows import order.
import * as styles from '@island.is/island-ui/core/Drawer/Drawer.css'
import { ModalBase } from '@island.is/island-ui/core/ModalBase/ModalBase'

interface DrawerProps {
  /**
   * Explain what this drawer is for
   */
  ariaLabel: string
  /**
   * Unique ID for accessibility purposes
   */
  baseId: string
  /**
   * Element that opens the drawer.
   * It will be forwarded neccessery props for a11y and event handling.
   */
  disclosure: React.ReactElement
  /**
   * Show immediately without clicking the disclosure button
   */
  initialVisibility?: boolean | undefined
  /**
   * Position of the drawer
   */
  position?: 'right' | 'left'
  /**
   * Controls visibility from the outside, e.g. to close the drawer
   * programmatically after a successful form submission.
   */
  isVisible?: boolean
  /**
   * Fired whenever the drawer's visibility changes, e.g. via the built-in
   * close button or the Escape key.
   */
  onVisibilityChange?: (isVisible: boolean) => void
}

export const Drawer = ({
  ariaLabel,
  baseId,
  disclosure,
  initialVisibility,
  position = 'right',
  isVisible,
  onVisibilityChange,
  children,
}: PropsWithChildren<DrawerProps>) => {
  return (
    <ModalBase
      disclosure={disclosure}
      baseId={baseId}
      modalLabel={ariaLabel}
      initialVisibility={initialVisibility}
      isVisible={isVisible}
      onVisibilityChange={onVisibilityChange}
      className={cn(styles.drawer, styles.position[position])}
    >
      {({ closeModal }: { closeModal: () => void }) => {
        return (
          <Box
            background="white"
            paddingY={[3, 6, 8]}
            paddingX={[3, 6, 8]}
            height="full"
            overflow="auto"
          >
            <Box className={styles.closeButton}>
              <Button
                circle
                colorScheme="negative"
                icon="close"
                aria-label="Close drawer"
                onClick={closeModal}
                size="large"
              />
            </Box>
            <Box>{children}</Box>
          </Box>
        )
      }}
    </ModalBase>
  )
}

export default Drawer
