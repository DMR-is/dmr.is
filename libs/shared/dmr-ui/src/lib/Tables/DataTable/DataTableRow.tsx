import { Table as T } from '@island.is/island-ui/core'
import { DataTableCell } from './DataTableCell'
import { DataTableColumnProps, DataTableRowProps } from './types'

export const DataTableRow = <T extends readonly DataTableColumnProps[]>({
  columns,
  ...row
}: DataTableRowProps<T>) => {
  return (
    <T.Row>
      {columns.map((column) => {
        const children = row[column.field as keyof typeof row]
        return <DataTableCell key={column.field}>{children}</DataTableCell>
      })}
    </T.Row>
  )
}
