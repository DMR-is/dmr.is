'use client'

import { useRouter } from 'next/navigation'

import { useState } from 'react'
import { useIntl } from 'react-intl'
import useSWRMutation from 'swr/mutation'

import { Box } from '@dmr.is/ui/components/island-is'

import { Button, Inline, Stack, toast } from '@island.is/island-ui/core'

import {
  PublishAdvertsRequest,
  StatusIdEnum,
  UpdateAdvertStatusRequest,
} from '../../../gen/fetch'
import { useClient } from '../../../hooks/useClient'
import { useFilterContext } from '../../../hooks/useFilters'
import { ritstjornTableMessages } from '../../../lib/messages/ritstjorn/tables'
import { toastMessages } from '../../../lib/messages/toast/messages'
import { trpc } from '../../../lib/trpc/client'
import AdvertsToBePublished from '../Tables/AdvertsToBePublished'

export const PublishingTab = () => {
  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])
  const publishClient = useClient('AdvertPublishApi')
  const updateClient = useClient('AdvertUpdateApi')

  const router = useRouter()
  const { formatMessage } = useIntl()

  const { params } = useFilterContext()

  const { data, refetch } =
    trpc.advertsApi.getReadyForPublicationAdverts.useQuery({
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

  const { trigger: publishAdvertsTrigger } = useSWRMutation(
    'publishAdverts',
    (_key: string, { arg }: { arg: PublishAdvertsRequest }) =>
      publishClient.publishAdverts(arg),
    {
      onSuccess: () => {
        refetch()
        setSelectedAdvertIds([])
        toast.success(formatMessage(toastMessages.publishAdverts.success))
        router.refresh()
      },
      onError: () => {
        toast.error(formatMessage(toastMessages.publishAdverts.failure))
      },
    },
  )

  const { trigger: updateAdvertStatusTrigger } = useSWRMutation(
    'updateAdvertStatus',
    (_key: string, { arg }: { arg: UpdateAdvertStatusRequest }) =>
      updateClient.updateAdvertStatus(arg),
    {
      onSuccess: () => {
        toast.success('Auglýsing færð í stöðuna innsend', {
          toastId: 'update-advert-status-success',
        })
        refetch()
        setSelectedAdvertIds([])
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra stöðu auglýsingar')
      },
    },
  )

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
                updateAdvertStatusTrigger({
                  id: id,
                  statusId: StatusIdEnum.SUBMITTED,
                })
                router.refresh()
              })
            }
          >
            {formatMessage(
              ritstjornTableMessages.publishing.removeFromPublishingQueue,
            )}
          </Button>
          <Button
            onClick={() =>
              publishAdvertsTrigger({
                publishAdvertsBody: { advertIds: selectedAdvertIds },
              })
            }
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
