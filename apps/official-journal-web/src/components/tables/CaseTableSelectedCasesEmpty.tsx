import { Table as T } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableEmpty } from './CaseTableEmpty'
import { TableHeadCell } from './CaseTableHeadCell'
import { messages } from './messages'

export const CaseTableSelectedCasesEmpty = () => {
  const { formatMessage } = useFormatMessage()
  return (
    <T.Table>
      <T.Head>
        <T.Row>
          <TableHeadCell small>
            {formatMessage(messages.tables.selectedCases.columns.number)}
          </TableHeadCell>
          <TableHeadCell>
            {formatMessage(messages.tables.selectedCases.columns.title)}
          </TableHeadCell>
        </T.Row>
      </T.Head>
      <CaseTableEmpty />
    </T.Table>
  )
}
