'use client'

import { useState } from 'react'
import { useIntl } from 'react-intl'

import { Box } from '@dmr.is/ui/components/island-is'

import { Button, Inline, Stack, toast } from '@island.is/island-ui/core'

import { StatusIdEnum } from '../../gen/fetch'
import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { trpc } from '../../lib/trpc/client'
import AdvertsToBePublished from '../Tables/AdvertsToBePublished'

export const PublishingTab = () => {
  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])
  const { formatMessage } = useIntl()
  const { params } = useFilterContext()
  const utils = trpc.useUtils()

  const { mutate: publishAdverts } =
    trpc.publications.publishAdverts.useMutation({
      onSuccess: () => {
        toast.success('Auglýsing birt', { toastId: 'publish-advert-success' })
        utils.adverts.getReadyForPublicationAdverts.invalidate({
          categoryId: params.categoryId,
          page: params.page,
          pageSize: params.pageSize,
          search: params.search,
          typeId: params.typeId,
        })
        setSelectedAdvertIds([])
      },
      onError: () => {
        toast.error('Ekki tókst að birta auglýsingu')
      },
    })

  const { mutate: updateAdvertStatus } =
    trpc.adverts.changeAdvertStatus.useMutation({
      onSuccess: () => {
        toast.success('Auglýsing færð í stöðuna innsend', {
          toastId: 'update-advert-status-success',
        })
        utils.adverts.getReadyForPublicationAdverts.invalidate({
          categoryId: params.categoryId,
          page: params.page,
          pageSize: params.pageSize,
          search: params.search,
          typeId: params.typeId,
        })
        setSelectedAdvertIds([])
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra stöðu auglýsingar')
      },
    })

  const { data } = trpc.adverts.getReadyForPublicationAdverts.useQuery({
    categoryId: params.categoryId,
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    typeId: params.typeId,
  })

  const handleAdvertToggle = (id: string) => {
    setSelectedAdvertIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((advertId) => advertId !== id)
        : [...prevSelected, id],
    )
  }

  return (
    <Box background="white">
      <Stack space={[3, 4, 5]}>
        <AdvertsToBePublished
          adverts={data?.adverts}
          selectedAdvertIds={selectedAdvertIds}
          onToggle={handleAdvertToggle}
        />
        <Inline space={2} align="right" flexWrap="wrap">
          <Button
            disabled={selectedAdvertIds.length === 0}
            colorScheme="destructive"
            icon="trash"
            iconType="outline"
            onClick={() =>
              selectedAdvertIds.forEach((id) => {
                updateAdvertStatus({
                  id: id,
                  statusId: StatusIdEnum.SUBMITTED,
                })
              })
            }
          >
            {formatMessage(
              ritstjornTableMessages.publishing.removeFromPublishingQueue,
            )}
          </Button>
          <Button
            onClick={() => publishAdverts({ advertIds: selectedAdvertIds })}
            disabled={selectedAdvertIds.length === 0}
            icon="arrowForward"
          >
            {formatMessage(ritstjornTableMessages.publishing.publish)}
          </Button>
        </Inline>
      </Stack>
    </Box>
  )
}
export default PublishingTab
