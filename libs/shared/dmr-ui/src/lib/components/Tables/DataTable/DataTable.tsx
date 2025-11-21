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
  noDataMessage,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelect = true,
  headerBackground,
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
      <T.Table style={{ tableLayout: layout, width: '100%' }}>
        <T.Head>
          <T.Row>
            {columns.map((column, i) => (
              <DataTableColumn
                key={i}
                {...column}
                background={headerBackground}
              />
            ))}
            {(hasLinkRows || hasExpandableRows) && (
              <DataTableColumn
                width="65px"
                field=""
                background={headerBackground}
              />
            )}
          </T.Row>
        </T.Head>
        <DataTableBody
          rows={rows as DataTableRowProps<T>[]}
          columns={columns}
          noDataMessage={noDataMessage}
        />
      </T.Table>
      {paging && (
        <DataTablePagination
          paging={paging}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          showPageSizeSelect={showPageSizeSelect}
        />
      )}
    </Stack>
  )
}
