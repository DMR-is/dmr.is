export type SearchDashboardFilterValue = {
  from: string
  to: string
  preset?: string | null
}

export type SearchDashboardFilterPreset = {
  label: string
  value: string
}

export type SearchDashboardFiltersProps = {
  title?: string
  helpText?: string
  fromLabel?: string
  toLabel?: string
  presetLabel?: string
  resetLabel?: string
  values: SearchDashboardFilterValue
  presets?: SearchDashboardFilterPreset[]
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onPresetChange?: (value: string) => void
  onReset?: () => void
}

export type SearchDashboardKpiItem = {
  label: string
  value: string
  description?: string
  helpText?: string
}

export type SearchDashboardTrendPoint = {
  label: string
  value: number
}

export type SearchDashboardTrendChartProps = {
  title: string
  description?: string
  helpText?: string
  points: SearchDashboardTrendPoint[]
  valueFormatter?: (value: number) => string
}

export type SearchDashboardBreakdownItem = {
  label: string
  value: string
  count: number
  percentage: number
}

export type SearchDashboardBreakdownCardProps = {
  title: string
  description?: string
  helpText?: string
  items: SearchDashboardBreakdownItem[]
}

export type SearchDashboardQueryTableColumnKey =
  | 'normalizedQuery'
  | 'count'
  | 'zeroResultRate'
  | 'avgDurationMs'
  | 'resultBucket'

export type SearchDashboardQueryTableColumn = {
  key: SearchDashboardQueryTableColumnKey
  label: string
  align?: 'left' | 'right'
  helpText?: string
}

export type SearchDashboardQueryTableRow = {
  normalizedQuery: string
  count: string
  zeroResultRate: string
  avgDurationMs: string
  resultBucket: string
}

export type SearchDashboardQueryTableProps = {
  title: string
  description?: string
  helpText?: string
  emptyMessage?: string
  columns?: SearchDashboardQueryTableColumn[]
  rows: SearchDashboardQueryTableRow[]
}

export type SearchDashboardEmptyStateProps = {
  title: string
  message: string
}

export type SearchDashboardProps = {
  title: string
  description?: string
  loading?: boolean
  empty?: boolean
  emptyState?: SearchDashboardEmptyStateProps
  filters?: SearchDashboardFiltersProps
  kpis?: SearchDashboardKpiItem[]
  trendCharts?: SearchDashboardTrendChartProps[]
  breakdowns?: SearchDashboardBreakdownCardProps[]
  queryTables?: SearchDashboardQueryTableProps[]
}
