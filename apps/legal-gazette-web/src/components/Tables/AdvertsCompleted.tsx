import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useCompletedAdverts } from '../../hooks/adverts/useCompletedAdverts'
import { useFilters } from '../../hooks/useFilters'
import { formatDate } from '../../lib/utils'

export const AdvertsCompleted = () => {
  const { params } = useFilters()

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
      noDataMessage="Engar kláraðar auglýsingar"
      loading={isLoading}
      columns={
        [
          {
            field: 'birting',
            children: 'Birting',
            sortable: true,
            size: 'tiny',
          },
          {
            field: 'skraning',
            children: 'Skráning',
            size: 'tiny',
            sortable: true,
          },
          {
            field: 'tegund',
            children: 'Tegund',
            width: '200px',
          },
          {
            field: 'flokkur',
            children: 'Flokkur',
            size: 'small',
          },
          {
            field: 'efni',
            fluid: true,
            children: 'Efni',
          },
        ] as const
      }
      rows={rows}
      paging={paging}
    />
  )
}

export default AdvertsCompleted
