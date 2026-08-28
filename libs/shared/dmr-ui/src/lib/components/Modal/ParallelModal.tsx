'use client'

import { useRouter } from 'next/navigation'

import { type ComponentRef, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Box } from '../../island-is/lib/Box'
import { Button } from '../../island-is/lib/Button'
import { GridColumn } from '../../island-is/lib/GridColumn'
import { GridContainer } from '../../island-is/lib/GridContainer'
import { GridRow } from '../../island-is/lib/GridRow'
import { Inline } from '../../island-is/lib/Inline'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import * as modalStyles from './Modal.css'
import * as styles from './ParallelModal.css'

type SpanType = React.ComponentProps<typeof GridColumn>['span']

type Props = {
  title?: string

  children: React.ReactNode
  toggleClose?: () => void
  width?: 'small' | 'large'
  allowOverflow?: boolean
}

export const ParallelModal = ({
  title,
  toggleClose,
  children,
  width = 'large',
  allowOverflow = false,
}: Props) => {
  const router = useRouter()

  const dialogRef = useRef<ComponentRef<'dialog'>>(null)

  // The portal below cannot render during SSR or on the first client render,
  // so nothing may touch `document` or `dialogRef` until after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Keyed on `mounted`: dialogRef is null until the portal exists.
  useEffect(() => {
    if (mounted && !dialogRef.current?.open) {
      dialogRef.current?.showModal()
    }
  }, [mounted])
  function onDismiss() {
    router.back()
  }
  const columnSpan: SpanType =
    width === 'small'
      ? ['10/12', '10/12', '10/12', '6/12']
      : ['12/12', '12/12', '12/12', '10/12', '8/12']
  const columnOffset: SpanType =
    width === 'small'
      ? ['1/12', '1/12', '1/12', '3/12']
      : ['0', '0', '0', '1/12', '2/12']
  // Rendering nothing until mounted also avoids the non-null assertion below
  // throwing when #modal-root is absent.
  const container = mounted ? document.getElementById('modal-root') : null
  if (!container) return null

  return createPortal(
    <div className={styles.backdrop({ color: 'default' })}>
      <dialog
        ref={dialogRef}
        onClose={onDismiss}
        className={styles.parallelModalDialog}
        style={{ border: 'none', borderRadius: '12px' }}
      >
        <Box className={modalStyles.modalBase}>
          <GridContainer>
            <GridRow>
              <GridColumn span={columnSpan} offset={columnOffset}>
                <Box
                  className={modalStyles.modalContent({
                    overflow: allowOverflow ? 'visible' : 'scrollable',
                  })}
                >
                  <Stack space={2}>
                    <Inline
                      justifyContent={title ? 'spaceBetween' : 'flexEnd'}
                      alignY="center"
                    >
                      {!!title && <Text variant="h3">{title}</Text>}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (toggleClose) {
                            toggleClose()
                          }
                          onDismiss()
                        }}
                        circle={true}
                        size="small"
                        icon="close"
                      />
                    </Inline>
                    {children}
                  </Stack>
                </Box>
              </GridColumn>
            </GridRow>
          </GridContainer>
        </Box>
      </dialog>
    </div>,
    container,
  )
}
