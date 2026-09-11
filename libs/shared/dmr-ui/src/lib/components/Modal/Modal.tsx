'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  ModalBase,
  Stack,
  Text,
} from '../../island-is'
import * as styles from './Modal.css'

type SpanType = React.ComponentProps<typeof GridColumn>['span']

type Props = {
  baseId?: string
  isVisible?: boolean
  title?: string
  onVisibilityChange?: (isVisible: boolean) => void
  disclosure?: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >
  children: React.ReactNode
  /**
   * Action row pinned to the bottom of the modal.
   *
   * Passing this changes how the modal scrolls: the title row and this footer
   * stay put and only `children` scrolls between them. Left out, the whole card
   * scrolls as before. One prop rather than two because a modal that pins its
   * buttons and lets its title scroll away reads as broken.
   */
  footer?: React.ReactNode
  toggleClose?: () => void
  width?: 'small' | 'large'
  allowOverflow?: boolean
}

export const Modal = ({
  baseId = '',
  isVisible = false,
  title,
  onVisibilityChange,
  toggleClose,
  disclosure,
  children,
  footer,
  width = 'large',
  allowOverflow = false,
}: Props) => {
  const hasPinnedChrome = !!footer
  const columnSpan: SpanType =
    width === 'small'
      ? ['10/12', '10/12', '10/12', '6/12']
      : ['12/12', '12/12', '12/12', '10/12', '8/12']
  const columnOffset: SpanType =
    width === 'small'
      ? ['1/12', '1/12', '1/12', '3/12']
      : ['0', '0', '0', '1/12', '2/12']

  const handleVisibilityChange = (visible: boolean) => {
    if (onVisibilityChange) {
      onVisibilityChange(visible)
    }
    // Add or remove class to body to set custom print styles when modal is open
    if (visible) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
  }

  return (
    <ModalBase
      baseId={baseId}
      isVisible={isVisible}
      onVisibilityChange={handleVisibilityChange}
      disclosure={disclosure}
      hideOnClickOutside={true}
      hideOnEsc={true}
      className={styles.modalBaseBackdrop}
    >
      {({ closeModal }) => {
        const header = (
          <Inline
            justifyContent={title ? 'spaceBetween' : 'flexEnd'}
            alignY="center"
          >
            {!!title && <Text variant="h3">{title}</Text>}
            <Button
              variant="ghost"
              onClick={() => {
                if (toggleClose) toggleClose()
                closeModal()
              }}
              circle={true}
              size="small"
              icon="close"
            />
          </Inline>
        )

        return (
          <Box dataTestId="modal-debug" className={styles.modalBase}>
            <GridContainer>
              <GridRow>
                <GridColumn span={columnSpan} offset={columnOffset}>
                  <Box
                    className={styles.modalContent({
                      // The card must stop scrolling when the chrome is
                      // pinned: the scroll moves to `pinnedBody`, and leaving
                      // it here too would let the card creep behind the title.
                      overflow:
                        allowOverflow || hasPinnedChrome
                          ? 'visible'
                          : 'scrollable',
                      scroll: hasPinnedChrome ? 'chrome' : undefined,
                    })}
                  >
                    {hasPinnedChrome ? (
                      <>
                        <Box className={styles.pinnedHeader}>{header}</Box>
                        {/*
                          `tabIndex={0}` because this box is the modal's only
                          scroll container, and a scrollable region nothing can
                          focus is unreachable by keyboard (WCAG 2.1.1).
                        */}
                        <Box className={styles.pinnedBody} tabIndex={0}>
                          {children}
                        </Box>
                        <Box className={styles.pinnedFooter}>{footer}</Box>
                      </>
                    ) : (
                      <Stack space={2}>
                        {header}
                        {children}
                      </Stack>
                    )}
                  </Box>
                </GridColumn>
              </GridRow>
            </GridContainer>
          </Box>
        )
      }}
    </ModalBase>
  )
}
