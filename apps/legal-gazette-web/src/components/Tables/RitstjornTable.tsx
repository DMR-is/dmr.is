import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useFilters } from '../../hooks/useFilters'

// TODO add accept proper data
export const RitstjornTable = () => {
  const { params } = useFilters()

  return (
    <DataTable
      columns={
        [
          {
            field: 'birting',
            children: 'Birting',
            sortable: true,
          },
          {
            field: 'skraning',
            children: 'Skráning',
            sortable: true,
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
      }}
    />
  )
}

export default RitstjornTable
