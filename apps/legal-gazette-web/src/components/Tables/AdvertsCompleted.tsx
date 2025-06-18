import { useIntl } from 'react-intl'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useCompletedAdverts } from '../../hooks/adverts/useCompletedAdverts'
import { useFilters } from '../../hooks/useFilters'
import { ritstjornTables } from '../../lib/messages/ritstjorn/tables'
import { formatDate } from '../../lib/utils'

export const AdvertsCompleted = () => {
  const { params } = useFilters()
  const { formatMessage } = useIntl()

  const { adverts, isLoading, paging } = useCompletedAdverts({
    query: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  const rows = adverts.map((advert) => ({
    birting: formatDate(advert.scheduledAt),
    skraning: formatDate(advert.createdAt),
    tegund: advert.type.title,
    flokkur: advert.category.title,
    efni: advert.title,
  }))

  return (
    <DataTable
      noDataMessage={formatMessage(ritstjornTables.general.noDataMessage)}
      loading={isLoading}
      columns={
        [
          {
            field: 'birting',
            children: formatMessage(ritstjornTables.columns.scheduledAt),
            sortable: true,
            size: 'tiny',
          },
          {
            field: 'skraning',
            children: formatMessage(ritstjornTables.columns.createdAt),
            size: 'tiny',
            sortable: true,
          },
          {
            field: 'tegund',
            children: formatMessage(ritstjornTables.columns.type),
            width: '200px',
          },
          {
            field: 'flokkur',
            children: formatMessage(ritstjornTables.columns.category),
            size: 'small',
          },
          {
            field: 'efni',
            children: formatMessage(ritstjornTables.columns.content),
            fluid: true,
          },
        ] as const
      }
      rows={rows}
      paging={paging}
    />
  )
}

export default AdvertsCompleted
