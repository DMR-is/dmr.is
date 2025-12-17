'use client'

import { useState } from 'react'
import { useIntl } from 'react-intl'

import { Box } from '@dmr.is/ui/components/island-is'

import { Button, Inline, Stack, toast } from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'
import AdvertsToBePublished from '../Tables/AdvertsToBePublished'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const PublishingTab = () => {
  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])
  const { formatMessage } = useIntl()
  const { params } = useFilterContext()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: publishAdverts } = useMutation(
    trpc.publishAdverts.mutationOptions({
      onSuccess: () => {
        toast.success('Auglýsing birt', { toastId: 'publish-advert-success' })
        queryClient.invalidateQueries(
          trpc.getReadyForPublicationAdverts.queryFilter({
            categoryId: params.categoryId,
            page: params.page,
            pageSize: params.pageSize,
            search: params.search,
            typeId: params.typeId,
          }),
        )
        setSelectedAdvertIds([])
      },
      onError: () => {
        toast.error('Ekki tókst að birta auglýsingu')
      },
    }),
  )

  const { mutate: moveToPreviousStatus } = useMutation(
    trpc.moveToPreviousStatus.mutationOptions({
      onSuccess: () => {
        toast.success('Auglýsing færð í stöðuna í vinnslu', {
          toastId: 'update-advert-status-success',
        })
        queryClient.invalidateQueries(
          trpc.getReadyForPublicationAdverts.queryFilter({
            categoryId: params.categoryId,
            page: params.page,
            pageSize: params.pageSize,
            search: params.search,
            typeId: params.typeId,
          }),
        )
        setSelectedAdvertIds([])
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra stöðu auglýsingar')
      },
    }),
  )

  const { data } = useQuery(
    trpc.getReadyForPublicationAdverts.queryOptions({
      categoryId: params.categoryId,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      typeId: params.typeId,
    }),
  )

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
            icon="removeCircle"
            iconType="outline"
            onClick={() =>
              selectedAdvertIds.forEach((id) => {
                moveToPreviousStatus({
                  id: id,
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
