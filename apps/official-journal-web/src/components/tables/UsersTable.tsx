import { parseAsInteger, useQueryState } from 'next-usequerystate'
import { DataTable } from '@dmr.is/ui'

export const UsersTable = () => {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(10),
  )

  return (
    <DataTable
      columns={[
        {
          field: 'name',
          children: 'Nafn',
        },
      ]}
      rows={[]}
      paging={{
        page,
        pageSize,
        totalItems: 13,
        totalPages: 2,
      }}
      onPaginate={setPage}
    />
  )
}

export default UsersTable
