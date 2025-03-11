import { DataTableRow } from './DataTableRow'
import { DataTableBodyProps, DataTableColumnProps } from './types'
import { Table as T, Text } from '@island.is/island-ui/core'
import * as styles from './DataTable.css'
export const DataTableBody = <T extends readonly DataTableColumnProps[]>({
  rows,
  columns,
  noDataMessage = 'Engin gögn fundust, líklegast þarf að breyta síu',
}: DataTableBodyProps<T>) => {
  return (
    <T.Body>
      {!rows || rows.length === 0 ? (
        <>
          <tr className={styles.emptyRow}>
            <td colSpan={columns.length}>
              <div className={styles.emptyRowMessageWrapper}>
                <Text color="dark400">
                  <span className={styles.emptyRowMessage}>
                    {noDataMessage}
                  </span>
                </Text>
              </div>
            </td>
          </tr>
          <tr className={styles.emptyRow}></tr>
        </>
      ) : (
        rows.map((row, rowIndex) => (
          <DataTableRow key={rowIndex} {...row} columns={columns} />
        ))
      )}
    </T.Body>
  )
}
