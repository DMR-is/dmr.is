import { DataTable } from '@dmr.is/ui'

import { useFilters } from '../../hooks/useFilters'

// TODO add accept proper data
export const RitstjornTable = () => {
  const { params, setParams } = useFilters()
  return (
    <DataTable
      columns={
        [
          {
            field: 'birting',
            children: 'Birting',
            onSort: (field) =>
              setParams({
                sortBy: field,
                direction: params.direction === 'asc' ? 'desc' : 'asc',
              }),
          },
          {
            field: 'skraning',
            children: 'Skráning',
            onSort: (field) =>
              setParams({
                sortBy: field,
                direction: params.direction === 'asc' ? 'desc' : 'asc',
              }),
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
      }}
      onPaginate={(page) => setParams({ page })}
    />
  )
}

export default RitstjornTable
