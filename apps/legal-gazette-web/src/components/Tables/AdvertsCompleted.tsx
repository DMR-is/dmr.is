'use client'

import { useIntl } from 'react-intl'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils-shared/format/date'

import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { StatusTag } from '../status-tag/StatusTag'

import { useQuery } from '@tanstack/react-query'
export const AdvertsCompleted = () => {
  const { params, handleSort } = useFilterContext()
  const { formatMessage } = useIntl()

  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.getCompletedAdverts.queryOptions(
      {
        categoryId: params.categoryId,
        typeId: params.typeId,
        statusId: params.statusId,
        search: params.search,
        page: params.page,
        pageSize: params.pageSize,
        direction: params.direction ?? undefined,
        sortBy: params.sortBy ?? undefined,
      },
      { placeholderData: (prev) => prev },
    ),
  )

  const rows = data?.adverts?.map((advert) => ({
    birting: advert.scheduledAt
      ? formatDate(advert.scheduledAt)
      : 'Engin útgáfudagsetning skráð',
    skraning: formatDate(advert.createdAt),
    utgafa: advert.lastPublishedAt
      ? formatDate(advert.lastPublishedAt)
      : 'Ekki útgefin',
    status: <StatusTag status={advert.status} />,
    efni: advert.title,
    tegund: advert.type.title,
    flokkur: advert.category.title,
    sender: advert.createdBy,
    owner: advert.assignedUser?.name,
    href: `/ritstjorn/${advert.id}`,
    hasLink: true,
    openLinkInNewTab: true,
  }))

  return (
    <Box background="white" paddingTop={4}>
      <DataTable
        noDataMessage={formatMessage(
          ritstjornTableMessages.general.noDataMessage,
        )}
        loading={isLoading}
        columns={
          [
            {
              field: 'birting',
              children: formatMessage(
                ritstjornTableMessages.columns.scheduledAt,
              ),
              sortable: true,
              size: 'tiny',
              onSort: handleSort,
            },
            {
              field: 'skraning',
              children: formatMessage(ritstjornTableMessages.columns.createdAt),
              size: 'tiny',
              sortable: true,
              onSort: handleSort,
            },
            {
              field: 'utgafa',
              children: formatMessage(
                ritstjornTableMessages.columns.publishedAt,
              ),
              size: 'tiny',
              sortable: false,
            },
            {
              field: 'status',
              children: formatMessage(ritstjornTableMessages.columns.status),
              size: 'tiny',
            },
            {
              field: 'efni',
              children: formatMessage(ritstjornTableMessages.columns.content),
              fluid: true,
            },
            {
              field: 'tegund',
              children: formatMessage(ritstjornTableMessages.columns.type),
              width: '200px',
            },
            {
              field: 'flokkur',
              children: formatMessage(ritstjornTableMessages.columns.category),
              size: 'small',
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
      />
    </Box>
  )
}

export default AdvertsCompleted
