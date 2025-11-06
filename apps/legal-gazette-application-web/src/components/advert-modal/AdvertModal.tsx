'use client'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  ModalBase,
  Stack,
} from '@island.is/island-ui/core'

import * as styles from './advert-modal.css'

type Props = {
  id: string
  html: string
  isVisible?: boolean
  onVisiblityChange?: (visible: boolean) => void
}

export const AdvertModal = ({
  id,
  html,
  isVisible = false,
  onVisiblityChange,
}: Props) => {
  return (
    <ModalBase
      initialVisibility={isVisible}
      isVisible={isVisible}
      baseId={id}
      onVisibilityChange={onVisiblityChange}
    >
      {({ closeModal }) => (
        <GridContainer>
          <GridRow>
            <GridColumn span={['10/12']} offset={['1/12']}>
              <Box className={styles.advertModalWrapperStyle}>
                <Box className={styles.advertModalStyle} padding={[2, 3, 4]}>
                  <Stack space={2}>
                    <Inline align="right" alignY="center">
                      <Button
                        variant="ghost"
                        onClick={closeModal}
                        circle={true}
                        icon="close"
                      />
                    </Inline>
                    <AdvertDisplay html={html} withStyles />
                  </Stack>
                </Box>
              </Box>
            </GridColumn>
          </GridRow>
        </GridContainer>
      )}
    </ModalBase>
  )
}
