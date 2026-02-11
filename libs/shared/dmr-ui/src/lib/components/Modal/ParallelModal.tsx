'use client'

import { useRouter } from 'next/navigation'

import cn from 'classnames'
import { type ElementRef, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { Box } from '../../island-is/lib/Box'
import { Button } from '../../island-is/lib/Button'
import { GridColumn } from '../../island-is/lib/GridColumn'
import { GridContainer } from '../../island-is/lib/GridContainer'
import { GridRow } from '../../island-is/lib/GridRow'
import { Inline } from '../../island-is/lib/Inline'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import { modalBase, modalBaseBackdrop, modalContent } from './Modal.css'
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

  const dialogRef = useRef<ElementRef<'dialog'>>(null)

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal()
    }
  }, [])
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
  return createPortal(
    <div className={cn(styles.backdrop, styles.backdropColor['default'])}>
      <dialog
        ref={dialogRef}
        onClose={onDismiss}
        className={cn(styles.parallelModal, modalBaseBackdrop)}
        style={{ border: 'none', borderRadius: '12px' }}
      >
        <Box className={modalBase}>
          <GridContainer>
            <GridRow>
              <GridColumn span={columnSpan} offset={columnOffset}>
                <Box
                  className={modalContent}
                  style={{ overflowY: allowOverflow ? 'visible' : 'auto' }}
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.getElementById('modal-root')!,
  )
}
