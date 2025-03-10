import {
  Pagination,
  SkeletonLoader,
  Stack,
  Table as T,
} from '@island.is/island-ui/core'
import { DataTableHeadCell } from './DataTableHeadCell'
import { DataTableCell } from './DataTableCell'

export type DataTableColumn = {
  field: string
  fluid?: boolean
  children: React.ReactNode
  direction?: 'asc' | 'desc'
  onSort?: (field: string) => void
}

export type DataTableProps<T extends readonly DataTableColumn[]> = {
  loading?: boolean
  columns: T
  rows: Array<{
    [K in T[number]['field']]: React.ReactNode
  }>
  paging?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  onPaginate?: (page: number) => void
}

export const DataTable = <T extends readonly DataTableColumn[]>({
  columns,
  rows,
  paging,
  loading = false,
  onPaginate,
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
      <T.Table>
        <T.Head>
          <T.Row>
            {columns.map((column) => (
              <DataTableHeadCell {...column} />
            ))}
          </T.Row>
        </T.Head>
        <T.Body>
          {rows.map((row, rowIndex) => (
            <T.Row key={rowIndex}>
              {columns.map((column) => {
                const children = row[column.field as keyof typeof row]
                return (
                  <DataTableCell key={column.field}>{children}</DataTableCell>
                )
              })}
            </T.Row>
          ))}
        </T.Body>
      </T.Table>
      {paging && onPaginate && (
        <Pagination
          page={paging.page}
          itemsPerPage={paging.pageSize}
          totalItems={paging.totalItems}
          totalPages={paging.totalPages}
          renderLink={(page, className, children) => (
            <button className={className} onClick={() => onPaginate(page)}>
              {children}
            </button>
          )}
        />
      )}
    </Stack>
  )
}
