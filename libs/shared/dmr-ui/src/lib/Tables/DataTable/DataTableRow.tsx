import { DataTableCell } from './DataTableCell'
import { DataTableColumnProps, DataTableRowProps } from './types'
import * as styles from './DataTable.css'
import { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { Icon } from '@island.is/island-ui/core'

export const DataTableRow = <T extends readonly DataTableColumnProps[]>({
  columns,
  isExpandable,
  startExpanded = false,
  ...row
}: DataTableRowProps<T>) => {
  const [expanded, setExpanded] = useState(startExpanded)
  const colSpan = columns.length + (isExpandable ? 1 : 0)
  return (
    <>
      <tr
        role={isExpandable ? 'button' : 'div'}
        className={styles.dataTableRow({ expandable: !!isExpandable })}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        {columns.map((column) => {
          const children = row[column.field as keyof typeof row]
          return <DataTableCell key={column.field}>{children}</DataTableCell>
        })}
        {isExpandable && (
          <DataTableCell>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              <Icon
                color="blue400"
                icon={expanded ? 'chevronUp' : 'chevronDown'}
              />
            </button>
          </DataTableCell>
        )}
      </tr>
      {isExpandable && (
        <tr>
          <td colSpan={colSpan}>
            <AnimateHeight duration={300} height={expanded ? 'auto' : 0}>
              {row.children}
            </AnimateHeight>
          </td>
        </tr>
      )}
    </>
  )
}
