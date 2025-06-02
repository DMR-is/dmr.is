import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useCases } from '../../hooks/cases/useCases'
import { useFilters } from '../../hooks/useFilters'
import { Route } from '../../lib/constants'
import { formatDate } from '../../lib/utils'

export const CaseTable = () => {
  const { params } = useFilters()

  const { cases, paging, isLoading } = useCases({
    query: {
      page: params.page,
      pageSize: params.pageSize,
    },
  })

  return (
    <DataTable
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
      rows={cases.map((c) => ({
        id: c.id,
        birting: c.schedueledAt
          ? formatDate(c.schedueledAt)
          : 'Engin birting framundan',
        skraning: formatDate(c.createdAt),
        tegund: c.type.title,
        flokkur: c.category.title,
        efni: c.title,
        hasLink: true,
        href: Route.RITSTJORN_ID.replace('[id]', c.id),
      }))}
      paging={paging}
    />
  )
}

export default CaseTable
