import { Case, CaseWithApplication, Paging } from '../../gen/fetch'

export type TableProps = {
  data: Array<CaseWithApplication>
  paging: Paging
}

export type PublishedTableProps = {
  data: Array<CaseWithApplication>
  paging: Paging
}
