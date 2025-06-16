import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

import { Button, Inline, Stack } from '@island.is/island-ui/core'

import { StatusIdEnum } from '../../gen/fetch'
import { useAdvertsInProgress } from '../../hooks/adverts/useAdvertsInProgress'
import { publishAdverts, setAdvertStatus } from '../../lib/api/fetchers'
import AdvertsToBePublished from '../Tables/AdvertsToBePublished'

export const PublishingTab = () => {
  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])

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
          Taka úr útgáfu
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
          Gefa út mál
        </Button>
      </Inline>
    </Stack>
  )
}
export default PublishingTab
