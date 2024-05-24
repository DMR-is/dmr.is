import { Case, Paging } from '../../gen/fetch'

export type TableProps = {
  data: Array<Case>
  paging: Paging
}

export type PublishedTableProps = {
  data: Array<Case>
  paging: Paging
}
