import { Table as T } from '../../../island-is/lib/Table'
import * as styles from './DataTable.css'
import { DataTableCellProps } from './types'

export const DataTableCell = ({ children }: DataTableCellProps) => {
  return (
    <T.Data
      box={{
        paddingLeft: [1, 2],
        paddingRight: [1, 2],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
      }}
    >
      <div className={styles.tableCell}>{children}</div>
    </T.Data>
  )
}
