import { Table as T } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableHeadCellProps } from './CaseTable'
import { CaseTableEmpty } from './CaseTableEmpty'
import { TableHeadCell } from './CaseTableHeadCell'
import { messages } from './messages'

export const CaseTableSelectedCasesEmpty = ({
  columns,
}: {
  columns: CaseTableHeadCellProps[]
}) => {
  const { formatMessage } = useFormatMessage()
  return (
    <T.Table>
      <T.Head>
        <T.Row>
          {columns.map((column, index) => (
            <TableHeadCell
              key={index}
              size={column.size}
              sortable={column.sortable}
              fixed={column.fixed}
            >
              {column.children}
            </TableHeadCell>
          ))}
        </T.Row>
      </T.Head>
      <CaseTableEmpty
        columns={columns.length}
        message={formatMessage(messages.tables.selectedCases.empty.message)}
      />
    </T.Table>
  )
}
