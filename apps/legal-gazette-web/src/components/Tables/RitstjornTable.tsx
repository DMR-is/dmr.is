import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useFilters } from '../../hooks/useFilters'
import { DEFAULT_SORT_DIRECTION, SortDirection } from '../../lib/constants'

// TODO add accept proper data
export const RitstjornTable = () => {
  const { params, setParams } = useFilters()

  const handleSort = (field: string) => {
    const isSameField = params.sortBy === field

    if (isSameField) {
      return setParams({
        direction:
          params.direction === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC,
      })
    }

    setParams({
      sortBy: field,
      direction: DEFAULT_SORT_DIRECTION,
    })
  }

  return (
    <DataTable
      columns={
        [
          {
            field: 'birting',
            children: 'Birting',
            onSort: handleSort,
            sortBy: params.sortBy ?? undefined,
            direction: params.direction,
          },
          {
            field: 'skraning',
            children: 'Skráning',
            onSort: handleSort,
            sortBy: params.sortBy ?? undefined,
            direction: params.direction,
          },
          {
            field: 'flokkur',
            children: 'Flokkur',
          },
          {
            field: 'efni',
            fluid: true,
            children: 'Efni',
          },
        ] as const
      }
      rows={[
        {
          uniqueKey: '1',
          hasLink: true,
          birting: '2021-09-01',
          skraning: '2021-09-01',
          flokkur: 'Lög',
          efni: 'Innköllun vegna skipta skv. lögum um skráningu raunverulegs eiganda nr. 82/2019. Innköllun vegna skipta skv. lögum um skráningu raunverulegs eiganda nr. 82/2019.',
        },
      ]}
      paging={{
        page: params.page,
        pageSize: 10,
        totalItems: 73,
        totalPages: 8,
        onPaginate: (page) => setParams({ page }),
      }}
    />
  )
}

export default RitstjornTable
