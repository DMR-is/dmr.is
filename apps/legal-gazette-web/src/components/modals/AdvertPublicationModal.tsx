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
  Text,
} from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../lib/trpc/client/trpc'
import * as styles from './advert-publication-modal.css'

import { useQuery } from '@tanstack/react-query'

type Props = {
  pubId: string
}

export const AdvertPublicationModal = ({ pubId }: Props) => {
  const trpc = useTRPC()

  const { data } = useQuery(
    trpc.getPublication.queryOptions(
      { id: pubId },
      {
        gcTime: 0,
      },
    ),
  )

  return (
    <ModalBase
      disclosure={
        <Button variant="ghost" size="small" disabled={!pubId}>
          <Text
            color={!pubId ? 'blue400' : 'currentColor'}
            fontWeight="semiBold"
            variant="small"
          >
            Skoða auglýsingu
          </Text>
        </Button>
      }
      baseId={`advert-publication-modal-${pubId}`}
    >
      {({ closeModal }) => (
        <GridContainer>
          <GridRow>
            <GridColumn span={['10/12', '8/12']} offset={['1/12', '2/12']}>
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
                    <AdvertDisplay html={data?.html} />
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
