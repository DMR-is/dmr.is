import { Table as T } from '@island.is/island-ui/core'

export type DataTableCellProps = {
  children?: React.ReactNode
}

export const DataTableCell = ({ children }: DataTableCellProps) => {
  return (
    <T.Data
      style={{ whiteSpace: 'nowrap' }}
      box={{
        paddingLeft: [1, 2],
        paddingRight: [1, 2],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
      }}
    >
      {children}
    </T.Data>
  )
}
