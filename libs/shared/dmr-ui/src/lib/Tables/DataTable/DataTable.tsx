import {
  Pagination,
  SkeletonLoader,
  Stack,
  Table as T,
} from '@island.is/island-ui/core'
import { DataTableColumn } from './DataTableColumn'

import {
  DataTableColumnProps,
  DataTableProps,
  DataTableRowProps,
} from './types'
import { DataTableBody } from './DataTableBody'

export const DataTable = <T extends readonly DataTableColumnProps[]>({
  columns,
  rows,
  paging,
  loading = false,
  layout = 'auto',
}: DataTableProps<T>) => {
  if (loading) {
    return (
      <SkeletonLoader
        repeat={5}
        height={44}
        space={1}
        borderRadius="standard"
      />
    )
  }

  return (
    <Stack space={4}>
      <T.Table style={{ tableLayout: layout }}>
        <T.Head>
          <T.Row>
            {columns.map((column, i) => (
              <DataTableColumn key={i} {...column} />
            ))}
          </T.Row>
        </T.Head>
        <DataTableBody
          rows={rows as DataTableRowProps<T>[]}
          columns={columns}
        />
      </T.Table>
      {paging && (
        <Pagination
          page={paging.page}
          itemsPerPage={paging.pageSize}
          totalItems={paging.totalItems}
          totalPages={paging.totalPages}
          renderLink={(page, className, children) => (
            <button
              className={className}
              onClick={() => paging.onPaginate && paging.onPaginate(page)}
            >
              {children}
            </button>
          )}
        />
      )}
    </Stack>
  )
}
