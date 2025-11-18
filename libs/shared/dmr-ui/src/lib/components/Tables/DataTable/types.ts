export type DataTableColumnProps = {
  field: string
  fluid?: boolean
  width?: string
  align?: 'left' | 'right' | 'center'
  size?: 'tiny' | 'small' | 'default'
  children?: React.ReactNode
  sortBy?: string
  sortable?: boolean
  direction?: 'asc' | 'desc'
  onSort?: (field: string) => void
}

export type DataTableCellProps = {
  children?: React.ReactNode
}

export type DataTableRowExpandableProps = {
  isExpandable?: boolean
  startExpanded?: boolean
  children?: React.ReactNode
}

export type DataTableRowHasLinkProps = {
  hasLink?: boolean
  href?: string
}

export type DataTableRowProps<T extends readonly DataTableColumnProps[]> = {
  [K in T[number]['field']]: React.ReactNode
} & {
  columns: T
  uniqueKey?: string
} & DataTableRowExpandableProps &
  DataTableRowHasLinkProps
export type DataTablePagingProps = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type DataTableBodyProps<T extends readonly DataTableColumnProps[]> = {
  columns: T
  rows?: Array<DataTableRowProps<T>>
  noDataMessage?: string
}

export type DataTablePaginationProps = {
  paging: DataTablePagingProps
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelect?: boolean
}

export type DataTableProps<T extends readonly DataTableColumnProps[]> = {
  layout?: 'fixed' | 'auto'
  loading?: boolean
  columns: T
  rows?: Array<Omit<DataTableRowProps<T>, 'columns'>>
  paging?: DataTablePagingProps
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelect?: boolean
  noDataMessage?: string
}
