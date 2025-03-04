import { Table as T } from '@island.is/island-ui/core'
import { DataTableHeadCell } from './DataTableHeadCell'
import { DataTableCell } from './DataTableCell'

export type DataTableColumn = {
  field: string
  fluid?: boolean
  children: React.ReactNode
}

export type DataTableProps<T extends readonly DataTableColumn[]> = {
  columns: T
  rows: Array<{
    [K in T[number]['field']]: React.ReactNode
  }>
}

export const DataTable = <T extends readonly DataTableColumn[]>({
  columns,
  rows,
}: DataTableProps<T>) => {
  return (
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
  )
}
