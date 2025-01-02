import { CaseOverview, Paging } from '../../gen/fetch'

export type TableProps = {
  cases: CaseOverview[]
  paging: Paging
  isLoading?: boolean
}

export type PublishedTableProps = {
  data: CaseOverview[]
  paging: Paging
  isLoading?: boolean
}
