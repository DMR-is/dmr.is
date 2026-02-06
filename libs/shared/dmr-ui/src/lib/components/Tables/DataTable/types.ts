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
  background?: string
  onSort?: (field: string) => void
}

export type DataTableCellProps = {
  children?: React.ReactNode
}

export type DataTableRowExpandableProps = {
  isExpandable?: boolean
  onExpandChange?: (expanded: boolean) => void
  startExpanded?: boolean
  children?: React.ReactNode
}

export type DataTableRowHasLinkProps = {
  hasLink?: boolean
  href?: string
  openLinkInNewTab?: boolean
}

export type DataTableRowData<T extends readonly DataTableColumnProps[]> = {
  [K in T[number]['field']]: React.ReactNode
}

export type DataTableRowProps<T extends readonly DataTableColumnProps[]> =
  DataTableRowData<T> & {
    columns: T
    uniqueKey?: string
    background?: string
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
  background?: string
}

export type DataTablePaginationProps = {
  paging: DataTablePagingProps
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelect?: boolean
}

// Define row data with field values
type DataTableRowFieldData<T extends readonly DataTableColumnProps[]> = {
  [K in T[number]['field']]: React.ReactNode
}

// Define expandable and link props separately
type DataTableRowMetadata = {
  uniqueKey?: string
  background?: string
  isExpandable?: boolean
  onExpandChange?: (expanded: boolean) => void
  startExpanded?: boolean
  children?: React.ReactNode
  hasLink?: boolean
  href?: string
}

export type DataTableRowInput<T extends readonly DataTableColumnProps[]> =
  DataTableRowFieldData<T> & DataTableRowMetadata

export type DataTableProps<T extends readonly DataTableColumnProps[]> = {
  layout?: 'fixed' | 'auto'
  loading?: boolean
  columns: T
  rows?: Array<DataTableRowInput<T>>
  paging?: DataTablePagingProps
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelect?: boolean
  noDataMessage?: string
  tableBackground?: string
}
