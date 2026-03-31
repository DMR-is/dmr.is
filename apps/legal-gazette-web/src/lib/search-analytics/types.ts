export enum SearchAnalyticsInterval {
  Day = 'day',
}

export enum SearchAnalyticsQueryTableType {
  Top = 'top',
  ZeroResults = 'zero_results',
  Slow = 'slow',
}

export type SearchAnalyticsOverviewResponse = {
  totalSearches: number
  zeroResultRate: number
  withFiltersRate: number
  avgDurationMs: number
  p95DurationMs: number
  pageOneRate: number
}

export type SearchAnalyticsTrendPoint = {
  date: string
  totalSearches: number
  zeroResultRate: number
  avgDurationMs: number
  p95DurationMs: number
}

export type SearchAnalyticsTrendsResponse = {
  points: SearchAnalyticsTrendPoint[]
}

export type SearchAnalyticsBreakdownItem = {
  key: string
  count: number
  percentage: number
}

export type SearchAnalyticsBreakdownsResponse = {
  queryKinds: SearchAnalyticsBreakdownItem[]
  resultBuckets: SearchAnalyticsBreakdownItem[]
  sortUsage: SearchAnalyticsBreakdownItem[]
  filterUsage: SearchAnalyticsBreakdownItem[]
}

export type SearchAnalyticsQueryRow = {
  normalizedQuery: string
  count: number
  zeroResultRate: number
  avgDurationMs: number
  resultBucket: string
}

export type SearchAnalyticsQueriesResponse = {
  type: SearchAnalyticsQueryTableType
  rows: SearchAnalyticsQueryRow[]
}

export type SearchAnalyticsRangeQuery = {
  from?: string
  to?: string
}

export type SearchAnalyticsTrendsQuery = SearchAnalyticsRangeQuery & {
  interval?: SearchAnalyticsInterval
}

export type SearchAnalyticsQueriesQuery = SearchAnalyticsRangeQuery & {
  type: SearchAnalyticsQueryTableType
}
