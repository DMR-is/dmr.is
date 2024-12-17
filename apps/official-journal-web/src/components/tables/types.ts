import { Case, Paging } from '../../gen/fetch'

export type TableProps = {
  data: Array<Case>
  paging: Paging
  isLoading?: boolean
}

export type PublishedTableProps = {
  data: Array<Case>
  paging: Paging
  isLoading?: boolean
}
