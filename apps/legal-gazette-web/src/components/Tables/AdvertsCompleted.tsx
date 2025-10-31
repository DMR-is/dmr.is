'use client'

import { useIntl } from 'react-intl'

import { Box } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { Tag } from '@island.is/island-ui/core'

import { StatusEnum, StatusIdEnum } from '../../gen/fetch'
import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/nTrpc/client/trpc'

import { useQuery } from '@tanstack/react-query'
export const AdvertsCompleted = () => {
  const { params } = useFilterContext()
  const { formatMessage } = useIntl()

  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.getCompletedAdverts.queryOptions({
      categoryId: params.categoryId,
      typeId: params.typeId,
      statusId: params.statusId as StatusIdEnum[],
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    }),
  )

  const rows = data?.adverts?.map((advert) => ({
    birting: formatDate(advert.scheduledAt),
    skraning: formatDate(advert.createdAt),
    status: (
      <Tag
        variant={advert.status.title === StatusEnum.Innsent ? 'blue' : 'mint'}
      >
        {advert.status.title}
      </Tag>
    ),
    efni: advert.title,
    tegund: advert.type.title,
    flokkur: advert.category.title,
    owner: advert.createdBy,
    href: `/ritstjorn/${advert.id}`,
    hasLink: true,
  }))

  return (
    <Box background="white">
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
            },
            {
              field: 'skraning',
              children: formatMessage(ritstjornTableMessages.columns.createdAt),
              size: 'tiny',
              sortable: true,
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
          ] as const
        }
        rows={rows}
        paging={data?.paging}
      />
    </Box>
  )
}

export default AdvertsCompleted
