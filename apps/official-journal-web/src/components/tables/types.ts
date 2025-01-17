import { Case, Paging } from '../../gen/fetch'

export type TableProps = {
  cases?: Case[]
  paging?: Paging
  isLoading?: boolean
}

export type PublishedTableProps = {
  cases?: Case[]
  paging?: Paging
  isLoading?: boolean
}
