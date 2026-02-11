import React from 'react'

import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import {
  Box,
  Button,
  Inline,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { PagingTotalItemsText } from '@dmr.is/ui/components/PagingTotaItemsText/PagingTotalItemsText'

type Props = {
  publicationsHtml?: string[]
  pagingInfo?: React.ComponentProps<typeof PagingTotalItemsText>
  disclosure?: React.ReactElement
  onVisibilityChange?: (visible: boolean) => void
}

export const CombinedHTMLModal = ({
  publicationsHtml,
  pagingInfo,
  disclosure,
  onVisibilityChange,
}: Props) => {
  return (
    <Modal disclosure={disclosure} onVisibilityChange={onVisibilityChange}>
      <Box padding={2} paddingTop={0} paddingBottom={6}>
        <>
          <Box className="print-hidden" marginBottom={4}>
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

              <PagingTotalItemsText {...pagingInfo} />
            </Inline>
          </Box>
          <Stack space={4}>
            {publicationsHtml?.map((html, i) => (
              <AdvertDisplay key={i} withStyles html={html} />
            ))}
          </Stack>
        </>
      </Box>
    </Modal>
  )
}
