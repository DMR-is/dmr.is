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

import { AdvertDto } from '../../../gen/fetch'
import { formatDate } from '../../../lib/utils'
import * as styles from './advert-modal.css'

type Props = {
  advert: AdvertDto
  isVisible?: boolean
  onVisiblityChange?: (visible: boolean) => void
}

export const AdvertModal = ({
  advert,
  isVisible = false,
  onVisiblityChange,
}: Props) => {
  return (
    <ModalBase
      isVisible={isVisible}
      baseId={`advert-${advert.id}`}
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
                    <AdvertDisplay
                      date={formatDate(advert.scheduledAt)}
                      html={advert.html}
                      number={`Útg nr:. ${advert.publicationNumber ?? 'Ekki til staðar'}`}
                      title={advert.title}
                      type={advert.type.title}
                    />
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
