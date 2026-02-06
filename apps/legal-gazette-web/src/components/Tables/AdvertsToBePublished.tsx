'use client'

import { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button, Inline, Stack, toast } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { Checkbox } from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const AdvertsToBePublished = () => {
  const { formatMessage } = useIntl()
  const { params, setParams, handleSort } = useFilterContext()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])

  const { mutate: publishAdverts, isPending: isPublishing } = useMutation(
    trpc.publishNextBulk.mutationOptions({
      onMutate: async ({ advertIds }) => {
        toast.info(
          `Birti ${advertIds.length} ${advertIds.length === 1 ? 'birtingu' : 'birtingar'}...`,
          { toastId: 'publishing-adverts' },
        )
      },
      onSuccess: async () => {
        toast.success('Auglýsing birt', { toastId: 'publish-advert-success' })

        queryClient.invalidateQueries(
          trpc.getReadyForPublicationAdverts.queryFilter(),
        )
        queryClient.invalidateQueries(trpc.getAdvertsCount.queryFilter())
        setSelectedAdvertIds([])
      },
      onError: (_err, variables) => {
        toast.error(
          `Ekki tókst að birta ${variables.advertIds.length} ${variables.advertIds.length === 1 ? 'birtingu' : 'birtingar'}`,
          {
            toastId: 'publish-advert-error',
          },
        )
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
            direction: params.direction ?? undefined,
            sortBy: params.sortBy ?? undefined,
          }),
        )

        queryClient.invalidateQueries(
          trpc.getAdvertsCount.queryFilter({
            categoryId: params.categoryId,
            typeId: params.typeId,
            search: params.search,
            statusId: params.statusId,
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
      direction: params.direction ?? undefined,
      sortBy: params.sortBy ?? undefined,
    }),
  )

  const rows = data?.adverts.map((advert) => ({
    checkbox: (
      <Checkbox
        checked={selectedAdvertIds.includes(advert.id)}
        onChange={(evt) => handleAdvertSelect(advert.id, evt.target.checked)}
      />
    ),
    utgafudagur: advert.scheduledAt
      ? formatDate(advert.scheduledAt)
      : 'Engin útgáfudagsetning skráð',
    flokkur: advert.category.title,
    efni: advert.title,
    sender: advert.createdBy,
    owner: advert.assignedUser?.name,
    href: `/ritstjorn/${advert.id}`,
    hasLink: true,
    openLinkInNewTab: true,
  }))

  const toggleAllAdverts = useCallback(() => {
    if (selectedAdvertIds.length === data?.adverts.length) {
      setSelectedAdvertIds([])
    } else {
      setSelectedAdvertIds(data?.adverts.map((ad) => ad.id) || [])
    }
  }, [data, selectedAdvertIds])

  const handleAdvertSelect = useCallback(
    (advertId: string, checked: boolean) => {
      if (checked) {
        setSelectedAdvertIds((prev) => [...prev, advertId])
      } else {
        setSelectedAdvertIds((prev) => prev.filter((id) => id !== advertId))
      }
    },
    [setSelectedAdvertIds],
  )

  return (
    <Stack space={[2, 3]}>
      <DataTable
        columns={
          [
            {
              field: 'checkbox',
              children: (
                <Checkbox
                  disabled={!data?.adverts.length}
                  onChange={() => toggleAllAdverts()}
                  checked={selectedAdvertIds.length === data?.adverts.length}
                />
              ),
              size: 'tiny',
            },
            {
              field: 'utgafudagur',
              children: formatMessage(
                ritstjornTableMessages.columns.publishingDate,
              ),
              size: 'tiny',
              sortable: true,
              onSort: () => handleSort('birting'),
            },
            {
              field: 'flokkur',
              children: formatMessage(ritstjornTableMessages.columns.category),
            },
            {
              field: 'efni',
              children: formatMessage(ritstjornTableMessages.columns.content),
            },

            {
              field: 'owner',
              children: formatMessage(ritstjornTableMessages.columns.owner),
            },
            {
              field: 'sender',
              children: formatMessage(ritstjornTableMessages.columns.sender),
            },
          ] as const
        }
        rows={rows}
        paging={data?.paging}
        onPageChange={(page) => setParams({ page: page })}
        onPageSizeChange={(pageSize) => setParams({ pageSize: pageSize })}
        showPageSizeSelect={true}
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
          loading={isPublishing}
          onClick={() => publishAdverts({ advertIds: selectedAdvertIds })}
          disabled={selectedAdvertIds.length === 0}
          icon="arrowForward"
        >
          {formatMessage(ritstjornTableMessages.publishing.publish)}
        </Button>
      </Inline>
    </Stack>
  )
}

export default AdvertsToBePublished
