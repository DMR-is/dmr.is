import { useState } from 'react'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import {
  AlertMessage,
  Box,
  Button,
  Inline,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { PagingTotalItemsText } from '@dmr.is/ui/components/PagingTotaItemsText/PagingTotalItemsText'

import { useFilters } from '../../../../hooks/useFilters'
import { usePublicationsHtml } from '../../../../hooks/usePublicationsHtml'

type Props = {
  openModal: boolean
  setOpenModal: (open: boolean) => void
}

export const ViewPublicationsOnPage = ({ openModal, setOpenModal }: Props) => {
  const { data, error, totalItems } = usePublicationsHtml()
  const { filters } = useFilters()

  return (
    <Modal
      isVisible={openModal}
      toggleClose={() => {
        setTimeout(() => {
          setOpenModal(false)
        }, 300)
      }}
    >
      <Box padding={2} paddingTop={0} paddingBottom={6}>
        {error ? (
          <AlertMessage
            type="error"
            title="Villa kom upp"
            message="Ekki tókst að sækja birtingar, vinsamlegast reynið aftur síðar"
          />
        ) : (
          <>
            <Box marginBottom={4}>
              <Inline justifyContent="spaceBetween" alignY="bottom">
                <Inline alignY="bottom" space={2}>
                  <Text variant="h2">Auglýsingar á síðu</Text>
                  <Button
                    circle
                    icon="print"
                    iconType="outline"
                    colorScheme="negative"
                    onClick={() => window.print()}
                    title="Prenta"
                  />
                </Inline>

                <PagingTotalItemsText
                  totalItems={totalItems}
                  paging={filters}
                />
              </Inline>
            </Box>
            <Stack space={4}>
              {data?.result.map((ad) => (
                <AdvertDisplay
                  key={ad.publication.id}
                  withStyles
                  html={ad.html}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Modal>
  )
}
