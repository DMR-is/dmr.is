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
} from '@dmr.is/ui/components/island-is'

import * as styles from './advert-publication-modal.css'

type Props = {
  id: string
  html: string
  isVisible?: boolean
  isLegacy?: boolean
  onVisibilityChange?: (visible: boolean) => void
}

export const AdvertPublicationModal = ({
  id,
  html,
  isVisible = false,
  isLegacy = false,
  onVisibilityChange,
}: Props) => {
  return (
    <ModalBase
      initialVisibility={isVisible}
      isVisible={isVisible}
      baseId={id}
      onVisibilityChange={(vis) => onVisibilityChange?.(vis)}
    >
      {({ closeModal }) => (
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '12/12', '10/12', '8/12']}
              offset={['0', '0', '0', '1/12', '2/12']}
            >
              <Box className={styles.advertModalWrapperStyle}>
                <Box className={styles.advertModalStyle} padding={[2, 3, 4]}>
                  <Stack space={2}>
                    <Inline align="right" alignY="center">
                      <Button
                        variant="ghost"
                        onClick={closeModal}
                        circle={true}
                        size="small"
                        icon="close"
                      />
                    </Inline>
                    <AdvertDisplay html={html} withStyles={!isLegacy} />
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
