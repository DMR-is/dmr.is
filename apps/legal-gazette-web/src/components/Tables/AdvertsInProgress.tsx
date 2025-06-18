import { useIntl } from 'react-intl'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { StatusIdEnum } from '../../gen/fetch'
import { useAdvertsInProgress } from '../../hooks/adverts/useAdvertsInProgress'
import { useFilters } from '../../hooks/useFilters'
import { ritstjornTables } from '../../lib/messages/ritstjorn/tables'
import { formatDate } from '../../lib/utils'

export const AdvertsInProgress = () => {
  const { params } = useFilters()

  const { formatMessage } = useIntl()

  const { adverts, isLoading, paging } = useAdvertsInProgress({
    params: {
      page: params.page,
      pageSize: params.pageSize,
      statusId: [StatusIdEnum.SUBMITTED],
    },
  })

  const rows = adverts.map((advert) => ({
    birting: formatDate(advert.scheduledAt),
    skraning: formatDate(advert.createdAt),
    tegund: advert.type.title,
    utgafunumer: advert.publicationNumber,
    // flokkur: advert.category.title,
    efni: advert.title,
    href: `/ritstjorn/${advert.caseId}?tab=${advert.id}`,
    hasLink: true,
  }))

  return (
    <DataTable
      noDataMessage={formatMessage(ritstjornTables.general.noDataMessage)}
      loading={isLoading}
      layout="auto"
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
            field: 'utgafunumer',
            children: formatMessage(ritstjornTables.columns.createdAt),
            size: 'tiny',
          },
          {
            field: 'tegund',
            children: formatMessage(ritstjornTables.columns.type),
            size: 'tiny',
          },
          {
            field: 'efni',
            children: formatMessage(ritstjornTables.columns.content),
          },
        ] as const
      }
      rows={rows}
      paging={paging}
    />
  )
}

export default AdvertsInProgress
