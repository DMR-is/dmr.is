export type DataTableColumnProps = {
  field: string
  fluid?: boolean
  width?: string
  align?: 'left' | 'right' | 'center'
  children?: React.ReactNode
  sortBy?: string
  onSort?: (field: string) => void
  direction?: 'asc' | 'desc'
}

export type DataTableCellProps = {
  children?: React.ReactNode
}

export type DataTableRowExpandableProps = {
  isExpandable?: boolean
  startExpanded?: boolean
  children?: React.ReactNode
}

export type DataTableRowProps<T extends readonly DataTableColumnProps[]> = {
  [K in T[number]['field']]: React.ReactNode
} & {
  columns: T
  uniqueKey?: string
} & DataTableRowExpandableProps
export type DataTablePagingProps = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPaginate?: (page: number) => void
}

export type DataTableBodyProps<T extends readonly DataTableColumnProps[]> = {
  columns: T
  rows?: Array<DataTableRowProps<T>>
  noDataMessage?: string
}

export type DataTableProps<T extends readonly DataTableColumnProps[]> = {
  layout?: 'fixed' | 'auto'
  loading?: boolean
  columns: T
  rows?: Array<Omit<DataTableRowProps<T>, 'columns'>>
  paging?: DataTablePagingProps
  noDataMessage?: string
}
