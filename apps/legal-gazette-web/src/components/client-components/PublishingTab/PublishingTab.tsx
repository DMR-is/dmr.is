'use client'

import { useState } from 'react'
import { useIntl } from 'react-intl'
import useSWRMutation from 'swr/mutation'

import { Button, Inline, Stack, toast } from '@island.is/island-ui/core'

import { StatusIdEnum } from '../../../gen/fetch'
import { useAdvertsInProgress } from '../../../hooks/adverts/useAdvertsInProgress'
import { publishAdverts, setAdvertStatus } from '../../../lib/api/fetchers'
import { ritstjornTableMessages } from '../../../lib/messages/ritstjorn/tables'
import { toastMessages } from '../../../lib/messages/toast/messages'
import AdvertsToBePublished from '../Tables/AdvertsToBePublished'

export const PublishingTab = () => {
  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])

  const { formatMessage } = useIntl()

  const { adverts, mutate: refetchAdvertsInProgress } = useAdvertsInProgress({
    params: {
      page: 1,
      pageSize: 100,
      statusId: [StatusIdEnum.READY_FOR_PUBLICATION],
    },
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
    publishAdverts,
    {
      onSuccess: () => {
        refetchAdvertsInProgress()
        setSelectedAdvertIds([])
        toast.success(formatMessage(toastMessages.publishAdverts.success))
      },
      onError: () => {
        toast.error(formatMessage(toastMessages.publishAdverts.failure))
      },
    },
  )

  const { trigger: updateAdvertStatusTrigger } = useSWRMutation(
    'updateAdvertStatus',
    setAdvertStatus,
    {
      onSuccess: () => {
        refetchAdvertsInProgress()
        setSelectedAdvertIds([])
      },
    },
  )

  return (
    <Stack space={[3, 4, 5]}>
      <AdvertsToBePublished
        adverts={adverts}
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
  )
}
export default PublishingTab
