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
  width = 'large',
  allowOverflow = false,
}: Props) => {
  const columnSpan: SpanType =
    width === 'small'
      ? ['10/12', '10/12', '10/12', '6/12']
      : ['12/12', '12/12', '12/12', '10/12', '8/12']
  const columnOffset: SpanType =
    width === 'small'
      ? ['1/12', '1/12', '1/12', '3/12']
      : ['0', '0', '0', '1/12', '2/12']
  return (
    <ModalBase
      baseId={baseId}
      isVisible={isVisible}
      onVisibilityChange={onVisibilityChange}
      disclosure={disclosure}
      hideOnClickOutside={true}
      hideOnEsc={true}
    >
      {({ closeModal }) => (
        <Box dataTestId="modal-debug" className={styles.modalBase}>
          <GridContainer>
            <GridRow>
              <GridColumn span={columnSpan} offset={columnOffset}>
                <Box
                  className={styles.modalContent}
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
                          if (toggleClose) toggleClose()
                          closeModal()
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
      )}
    </ModalBase>
  )
}
