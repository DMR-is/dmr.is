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

type Props = {
  baseId?: string
  isVisible?: boolean
  title?: string
  onVisibilityChange?: (isVisible: boolean) => void
  disclosure: React.ReactElement<any, string | React.JSXElementConstructor<any>>
  children: React.ReactNode
  toggleClose?: () => void
}

export const Modal = ({
  baseId = '',
  isVisible = false,
  title,
  onVisibilityChange,
  disclosure,
  children,
}: Props) => {
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
              <GridColumn span={['10/12', '8/12']} offset={['1/12', '2/12']}>
                <Box className={styles.modalContent}>
                  <Stack space={2}>
                    <Inline
                      justifyContent={title ? 'spaceBetween' : 'flexEnd'}
                      alignY="center"
                    >
                      {!!title && <Text variant="h3">{title}</Text>}
                      <Button
                        icon="close"
                        size="small"
                        circle
                        onClick={closeModal}
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
