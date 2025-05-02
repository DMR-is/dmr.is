import { SkeletonLoader, Stack, Table as T } from '@island.is/island-ui/core'

import { DataTableBody } from './DataTableBody'
import { DataTableColumn } from './DataTableColumn'
import { DataTablePagination } from './DataTablePagination'
import {
  DataTableColumnProps,
  DataTableProps,
  DataTableRowProps,
} from './types'

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

  const hasExpandableRows = rows?.some((row) => !!row.isExpandable)
  const hasLinkRows = rows?.some((row) => !!row.hasLink)

  return (
    <Stack space={4}>
      <T.Table style={{ tableLayout: layout }}>
        <T.Head>
          <T.Row>
            {columns.map((column, i) => (
              <DataTableColumn key={i} {...column} />
            ))}
            {hasLinkRows && <DataTableColumn width="65px" field="" />}
            {hasExpandableRows && <DataTableColumn width="65px" field="" />}
          </T.Row>
        </T.Head>
        <DataTableBody
          rows={rows as DataTableRowProps<T>[]}
          columns={columns}
        />
      </T.Table>
      {paging && <DataTablePagination paging={paging} />}
    </Stack>
  )
}
