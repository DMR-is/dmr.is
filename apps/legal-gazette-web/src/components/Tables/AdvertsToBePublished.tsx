'use client'

import { useIntl } from 'react-intl'

import {
  Button,
  Checkbox,
  Inline,
  Stack,
  toast,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { useAdvertSelection } from '../../hooks/useAdvertSelection'
import { useBulkPublish } from '../../hooks/useBulkPublish'
import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const AdvertsToBePublished = () => {
  const { formatMessage } = useIntl()
  const { params, setParams, handleSort } = useFilterContext()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

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

  const {
    selectedAdvertIds,
    toggleAllAdverts,
    handleAdvertSelect,
    clearSelection,
  } = useAdvertSelection(data?.adverts.length)

  const { publishNextBulk, isPending: isPublishing } = useBulkPublish({
    onSuccess: clearSelection,
  })

  const { mutate: moveToPreviousStatusBulk, isPending: isMoving } = useMutation(
    trpc.moveToPreviousStatusBulk.mutationOptions({
      onSuccess: () => {
        toast.success('Auglýsingar færðar í vinnslu', {
          toastId: 'update-advert-status-success',
        })

        // Use parameterless invalidation for all related queries
        queryClient.invalidateQueries(
          trpc.getReadyForPublicationAdverts.queryFilter(),
        )
        queryClient.invalidateQueries(trpc.getAdvertsCount.queryFilter())

        clearSelection()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra stöðu auglýsinga')
      },
    }),
  )

  const rows = data?.adverts.map((advert) => ({
    checkbox: (
      <Checkbox
        label=""
        checked={selectedAdvertIds.includes(advert.id)}
        onChange={(evt) => handleAdvertSelect(advert.id, evt.target.checked)}
      />
    ),
    utgafudagur: advert.scheduledAt
      ? formatDate(advert.scheduledAt)
      : formatMessage(ritstjornTableMessages.publishing.noScheduledDate),
    flokkur: advert.category.title,
    efni: advert.title,
    sender: advert.createdBy,
    owner: advert.assignedUser?.name,
    href: `/ritstjorn/${advert.id}`,
    hasLink: true,
    openLinkInNewTab: true,
  }))

  return (
    <Stack space={[2, 3]}>
      <DataTable
        columns={
          [
            {
              field: 'checkbox',
              children: (
                <Checkbox
                  label=""
                  disabled={!data?.adverts.length}
                  onChange={() => toggleAllAdverts(data?.adverts)}
                  checked={
                    selectedAdvertIds.length === data?.adverts.length &&
                    data?.adverts.length > 0
                  }
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
          disabled={selectedAdvertIds.length === 0 || isMoving}
          loading={isMoving}
          colorScheme="destructive"
          icon="removeCircle"
          iconType="outline"
          onClick={() =>
            moveToPreviousStatusBulk({ advertIds: selectedAdvertIds })
          }
        >
          {formatMessage(
            ritstjornTableMessages.publishing.removeFromPublishingQueue, {
              count: selectedAdvertIds.length,
              noun:
                selectedAdvertIds.length === 1
                  ? 'auglýsingu'
                  : 'auglýsingar',
            }
          )}
        </Button>
        <Button
          onClick={() => publishNextBulk({ advertIds: selectedAdvertIds })}
          loading={isPublishing}
          icon="arrowForward"
          disabled={!selectedAdvertIds.length}
        >
          {formatMessage(ritstjornTableMessages.publishing.publishCount, {
            count: selectedAdvertIds.length,
            noun: selectedAdvertIds.length === 1 ? 'auglýsingu' : 'auglýsingar',
          })}
        </Button>
      </Inline>
    </Stack>
  )
}

export default AdvertsToBePublished
