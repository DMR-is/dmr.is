import { Table as T, Text } from '@island.is/island-ui/core'

import * as styles from './DataTable.css'
import { DataTableRow } from './DataTableRow'
import { DataTableBodyProps, DataTableColumnProps } from './types'
export const DataTableBody = <T extends readonly DataTableColumnProps[]>({
  rows,
  columns,
  noDataMessage = 'Engin gögn fundust, líklegast þarf að breyta síu',
  background,
}: DataTableBodyProps<T>) => {
  return (
    <T.Body>
      {!rows || rows.length === 0 ? (
        <>
          <tr className={styles.emptyRow} style={{ background: background }}>
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
          <tr
            className={styles.emptyRow}
            style={{ background: background }}
          ></tr>
        </>
      ) : (
        rows.map((row, rowIndex) => {
          return (
            <DataTableRow
              key={row.uniqueKey ? row.uniqueKey : rowIndex}
              {...row}
              columns={columns}
              background={background}
            />
          )
        })
      )}
    </T.Body>
  )
}
