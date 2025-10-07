'use client'

import { useIntl } from 'react-intl'

import { Box } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { StatusIdEnum } from '../../../gen/fetch'
import { useFilterContext } from '../../../hooks/useFilters'
import { ritstjornTableMessages } from '../../../lib/messages/ritstjorn/tables'
import { trpc } from '../../../lib/trpc/client'

export const AdvertsCompleted = () => {
  const { params } = useFilterContext()
  const { formatMessage } = useIntl()

  const { data, isLoading } = trpc.getCompletedAdverts.useQuery({
    categoryId: params.categoryId,
    typeId: params.typeId,
    statusId: params.statusId as StatusIdEnum[],
    search: params.search,
    page: params.page,
    pageSize: params.pageSize,
  })

  const rows = data?.adverts?.map((advert) => ({
    birting: formatDate(advert.scheduledAt),
    skraning: formatDate(advert.createdAt),
    tegund: advert.type.title,
    flokkur: advert.category.title,
    efni: advert.title,
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
              field: 'efni',
              children: formatMessage(ritstjornTableMessages.columns.content),
              fluid: true,
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
