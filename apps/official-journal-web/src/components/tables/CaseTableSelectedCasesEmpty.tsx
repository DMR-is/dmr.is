import { Table as T } from '@island.is/island-ui/core'

import { CaseTableEmpty } from './CaseTableEmpty'
import { TableHeadCell } from './CaseTableHeadCell'

export const CaseTableSelectedCasesEmpty = () => {
  return (
    <T.Table>
      <T.Head>
        <T.Row>
          <TableHeadCell small>Númer</TableHeadCell>
          <TableHeadCell>Heiti</TableHeadCell>
        </T.Row>
      </T.Head>
      <CaseTableEmpty />
    </T.Table>
  )
}
