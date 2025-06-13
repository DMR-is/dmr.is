import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Checkbox } from '@island.is/island-ui/core'

import { StatusIdEnum } from '../../gen/fetch'
import { useAdvertsInProgress } from '../../hooks/adverts/useAdvertsInProgress'
import { useFilters } from '../../hooks/useFilters'
import { formatDate } from '../../lib/utils'

export const AdvertsToBePublished = () => {
  const { params } = useFilters()

  const { adverts, isLoading, paging } = useAdvertsInProgress({
    params: {
      page: params.page,
      pageSize: params.pageSize,
      statusId: [StatusIdEnum.READY_FOR_PUBLICATION],
    },
  })

  const rows = adverts.map((advert) => ({
    checkbox: <Checkbox />,
    flokkur: advert.category.title,
    efni: advert.title,
    utgafudagur: formatDate(advert.scheduledAt),
    stofnun: 'Stofnun',
  }))

  return (
    <DataTable
      noDataMessage="Engar auglýsingar tilbúnar til útgáfu"
      loading={isLoading}
      columns={
        [
          {
            field: 'checkbox',
            children: '',
            size: 'tiny',
          },
          {
            field: 'flokkur',
            children: 'Flokkur',
            size: 'small',
          },
          {
            field: 'efni',
            children: 'Efni',
          },
          {
            field: 'utgafudagur',
            children: 'Útgáfudagur',
            size: 'small',
          },
          {
            field: 'stofnun',
            children: 'Stofnun',
            size: 'small',
          },
        ] as const
      }
      rows={rows}
      paging={paging}
    />
  )
}

export default AdvertsToBePublished
